import { createFunctionLogger } from "./logger.ts";
import { mercadoPagoAPICall, parseJSONWithRetry } from "./retry.ts";
import { subscriptionCache, getCacheKey } from "./cache.ts";
import { getAllPlans, getPlan } from "./subscription-plans.ts";
import { createAnalyticsTracker } from "./analytics.ts";

const logger = createFunctionLogger("subscription-management");

export interface SubscriptionChangeRequest {
  userId: string;
  currentPlanId: string;
  newPlanId: string;
  changeType: "upgrade" | "downgrade";
  effectiveDate?: Date;
  prorationMode: "immediate" | "next_billing" | "none";
}

export interface ProrationCalculation {
  currentPlanAmount: number;
  newPlanAmount: number;
  daysUsed: number;
  daysTotal: number;
  refundAmount: number;
  chargeAmount: number;
  netAmount: number;
}

export class SubscriptionManager {
  private supabaseClient: any;
  private accessToken: string;
  private analyticsTracker: any;

  constructor(supabaseClient: any, accessToken: string) {
    this.supabaseClient = supabaseClient;
    this.accessToken = accessToken;
    this.analyticsTracker = createAnalyticsTracker(supabaseClient);
  }

  async changeSubscriptionPlan(
    request: SubscriptionChangeRequest
  ): Promise<any> {
    const {
      userId,
      currentPlanId,
      newPlanId,
      changeType,
      effectiveDate,
      prorationMode,
    } = request;

    try {
      logger.info(
        "Processing subscription plan change",
        {
          userId,
          currentPlanId,
          newPlanId,
          changeType,
          prorationMode,
        },
        userId
      );

      // Validate plans exist
      const currentPlan = getPlan(currentPlanId);
      const newPlan = getPlan(newPlanId);

      if (!currentPlan || !newPlan) {
        throw new Error(
          `Invalid plan ID: ${!currentPlan ? currentPlanId : newPlanId}`
        );
      }

      // Get current subscription details
      const { data: currentSubscription } = await this.supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!currentSubscription) {
        throw new Error("No active subscription found");
      }

      // Calculate proration if needed
      let proration: ProrationCalculation | null = null;
      if (prorationMode === "immediate") {
        proration = this.calculateProration(
          currentPlan,
          newPlan,
          currentSubscription
        );
      }

      // Handle different change scenarios
      let result;
      if (changeType === "upgrade") {
        result = await this.processUpgrade(
          request,
          currentSubscription,
          proration
        );
      } else {
        result = await this.processDowngrade(
          request,
          currentSubscription,
          proration
        );
      }

      // Track the change
      await this.analyticsTracker.trackSubscriptionEvent(
        changeType === "upgrade"
          ? "subscription_upgraded"
          : "subscription_downgraded",
        userId,
        {
          id: currentSubscription.stripe_customer_id,
          plan: newPlan.id,
          amount: newPlan.price,
          currency: newPlan.currency,
          previous_plan: currentPlan.id,
          proration_amount: proration?.netAmount || 0,
        }
      );

      logger.info(
        "Subscription plan change completed",
        {
          userId,
          changeType,
          newPlanId,
          result: result.success,
        },
        userId
      );

      return result;
    } catch (error) {
      logger.error(
        "Error changing subscription plan",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
          changeType,
        },
        userId
      );
      throw error;
    }
  }

  private calculateProration(
    currentPlan: any,
    newPlan: any,
    subscription: any
  ): ProrationCalculation {
    const now = new Date();
    const billingStart = new Date(
      subscription.subscription_start || subscription.created_at
    );
    const billingEnd = new Date(subscription.subscription_end);

    const totalDays = Math.ceil(
      (billingEnd.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const usedDays = Math.ceil(
      (now.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.max(0, totalDays - usedDays);

    // Calculate refund for unused portion of current plan
    const refundAmount = (currentPlan.price / totalDays) * remainingDays;

    // Calculate charge for new plan (prorated for remaining period)
    const chargeAmount = (newPlan.price / totalDays) * remainingDays;

    const netAmount = chargeAmount - refundAmount;

    return {
      currentPlanAmount: currentPlan.price,
      newPlanAmount: newPlan.price,
      daysUsed: usedDays,
      daysTotal: totalDays,
      refundAmount,
      chargeAmount,
      netAmount,
    };
  }

  private async processUpgrade(
    request: SubscriptionChangeRequest,
    currentSubscription: any,
    proration: ProrationCalculation | null
  ): Promise<any> {
    const { userId, newPlanId, prorationMode } = request;
    const newPlan = getSubscriptionPlan(newPlanId);

    try {
      // For immediate upgrades, process payment for the difference
      if (
        prorationMode === "immediate" &&
        proration &&
        proration.netAmount > 0
      ) {
        const paymentResult = await this.processImmediatePayment(
          userId,
          proration.netAmount,
          `Upgrade to ${newPlan?.name} plan`
        );

        if (!paymentResult.success) {
          throw new Error("Payment failed for upgrade");
        }
      }

      // Update subscription in database
      const updateData: any = {
        subscription_tier: newPlan?.name,
        plan_id: newPlanId,
        updated_at: new Date().toISOString(),
      };

      if (prorationMode === "immediate") {
        // Upgrade takes effect immediately
        updateData.subscription_start = new Date().toISOString();
        if (proration) {
          // Extend subscription end based on new plan
          const newEndDate = new Date();
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          updateData.subscription_end = newEndDate.toISOString();
        }
      } else {
        // Upgrade takes effect at next billing cycle
        updateData.pending_plan_change = newPlanId;
        updateData.plan_change_effective_date =
          request.effectiveDate?.toISOString() ||
          currentSubscription.subscription_end;
      }

      await this.supabaseClient
        .from("subscribers")
        .update(updateData)
        .eq("user_id", userId);

      // Invalidate cache
      subscriptionCache.invalidate(getCacheKey.subscription(userId));

      return {
        success: true,
        changeType: "upgrade",
        effectiveDate:
          prorationMode === "immediate" ? new Date() : request.effectiveDate,
        proration,
      };
    } catch (error) {
      logger.error(
        "Error processing upgrade",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        userId
      );
      throw error;
    }
  }

  private async processDowngrade(
    request: SubscriptionChangeRequest,
    currentSubscription: any,
    proration: ProrationCalculation | null
  ): Promise<any> {
    const { userId, newPlanId, prorationMode } = request;
    const newPlan = getSubscriptionPlan(newPlanId);

    try {
      // For downgrades, we typically don't process immediate changes
      // Instead, we schedule the change for the next billing cycle
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (prorationMode === "immediate") {
        // Immediate downgrade
        updateData.subscription_tier = newPlan?.name;
        updateData.plan_id = newPlanId;
        updateData.subscription_start = new Date().toISOString();

        // Process refund if applicable
        if (proration && proration.netAmount < 0) {
          await this.processRefund(
            userId,
            Math.abs(proration.netAmount),
            "Downgrade refund"
          );
        }
      } else {
        // Schedule downgrade for next billing cycle
        updateData.pending_plan_change = newPlanId;
        updateData.plan_change_effective_date =
          request.effectiveDate?.toISOString() ||
          currentSubscription.subscription_end;
      }

      await this.supabaseClient
        .from("subscribers")
        .update(updateData)
        .eq("user_id", userId);

      // Invalidate cache
      subscriptionCache.invalidate(getCacheKey.subscription(userId));

      return {
        success: true,
        changeType: "downgrade",
        effectiveDate:
          prorationMode === "immediate" ? new Date() : request.effectiveDate,
        proration,
      };
    } catch (error) {
      logger.error(
        "Error processing downgrade",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        userId
      );
      throw error;
    }
  }

  private async processImmediatePayment(
    userId: string,
    amount: number,
    description: string
  ): Promise<any> {
    try {
      const paymentRequest = {
        transaction_amount: amount / 100, // Convert from cents
        description,
        external_reference: userId,
        notification_url: globalThis.Deno?.env.get("WEBHOOK_URL"),
      };

      const response = await mercadoPagoAPICall(
        "https://api.mercadopago.com/v1/payments",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`Payment API error: ${response.status}`);
      }

      const payment = await parseJSONWithRetry(response);

      return {
        success: payment.status === "approved",
        paymentId: payment.id,
        status: payment.status,
      };
    } catch (error) {
      logger.error(
        "Error processing immediate payment",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
          amount,
        },
        userId
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async processRefund(
    userId: string,
    amount: number,
    reason: string
  ): Promise<any> {
    try {
      // Get the last successful payment for this user
      const { data: lastPayment } = await this.supabaseClient
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!lastPayment) {
        throw new Error("No payment found to refund");
      }

      // Create refund request
      const refundRequest = {
        amount: amount / 100, // Convert from cents
        reason,
      };

      const response = await mercadoPagoAPICall(
        `https://api.mercadopago.com/v1/payments/${lastPayment.payment_id}/refunds`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(refundRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`Refund API error: ${response.status}`);
      }

      const refund = await parseJSONWithRetry(response);

      // Track refund
      await this.analyticsTracker.trackPaymentEvent(
        "payment_refunded",
        userId,
        {
          id: refund.id,
          amount: amount,
          currency: "brl",
          payment_method: lastPayment.payment_method,
          refund_reason: reason,
        }
      );

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
      };
    } catch (error) {
      logger.error(
        "Error processing refund",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
          amount,
        },
        userId
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async processPendingPlanChanges(): Promise<void> {
    try {
      const now = new Date();

      // Get all subscriptions with pending plan changes that are due
      const { data: pendingChanges } = await this.supabaseClient
        .from("subscribers")
        .select("*")
        .not("pending_plan_change", "is", null)
        .lte("plan_change_effective_date", now.toISOString());

      if (!pendingChanges || pendingChanges.length === 0) {
        logger.info("No pending plan changes to process", {});
        return;
      }

      logger.info("Processing pending plan changes", {
        count: pendingChanges.length,
      });

      for (const subscription of pendingChanges) {
        await this.applyPendingPlanChange(subscription);
      }
    } catch (error) {
      logger.error("Error processing pending plan changes", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async applyPendingPlanChange(subscription: any): Promise<void> {
    try {
      const newPlan = getSubscriptionPlan(subscription.pending_plan_change);
      if (!newPlan) {
        logger.warn(
          "Invalid pending plan change",
          {
            userId: subscription.user_id,
            planId: subscription.pending_plan_change,
          },
          subscription.user_id
        );
        return;
      }

      // Calculate new billing period
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      // Apply the plan change
      await this.supabaseClient
        .from("subscribers")
        .update({
          subscription_tier: newPlan.name,
          plan_id: subscription.pending_plan_change,
          subscription_start: new Date().toISOString(),
          subscription_end: newEndDate.toISOString(),
          pending_plan_change: null,
          plan_change_effective_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", subscription.user_id);

      // Invalidate cache
      subscriptionCache.invalidate(
        getCacheKey.subscription(subscription.user_id)
      );

      // Track the change
      const currentPlan = getSubscriptionPlan(subscription.plan_id);
      const changeType =
        newPlan.price > (currentPlan?.price || 0) ? "upgrade" : "downgrade";

      await this.analyticsTracker.trackSubscriptionEvent(
        changeType === "upgrade"
          ? "subscription_upgraded"
          : "subscription_downgraded",
        subscription.user_id,
        {
          id: subscription.stripe_customer_id,
          plan: newPlan.id,
          amount: newPlan.price,
          currency: newPlan.currency,
          previous_plan: subscription.plan_id,
        }
      );

      logger.info(
        "Pending plan change applied",
        {
          userId: subscription.user_id,
          changeType,
          newPlan: newPlan.id,
        },
        subscription.user_id
      );
    } catch (error) {
      logger.error(
        "Error applying pending plan change",
        {
          error: error instanceof Error ? error.message : String(error),
          userId: subscription.user_id,
        },
        subscription.user_id
      );
    }
  }

  async getAvailableUpgrades(userId: string): Promise<any[]> {
    try {
      const { data: subscription } = await this.supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!subscription) {
        return SUBSCRIPTION_PLANS.filter((plan) => plan.id !== "free");
      }

      const currentPlan = getSubscriptionPlan(subscription.plan_id);
      if (!currentPlan) {
        return SUBSCRIPTION_PLANS.filter((plan) => plan.id !== "free");
      }

      // Return plans with higher price
      return SUBSCRIPTION_PLANS.filter(
        (plan) => plan.price > currentPlan.price && plan.id !== currentPlan.id
      );
    } catch (error) {
      logger.error(
        "Error getting available upgrades",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        userId
      );
      return [];
    }
  }

  async getAvailableDowngrades(userId: string): Promise<any[]> {
    try {
      const { data: subscription } = await this.supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!subscription) {
        return [];
      }

      const currentPlan = getSubscriptionPlan(subscription.plan_id);
      if (!currentPlan) {
        return SUBSCRIPTION_PLANS.filter((plan) => plan.id === "free");
      }

      // Return plans with lower or equal price
      return SUBSCRIPTION_PLANS.filter(
        (plan) => plan.price <= currentPlan.price && plan.id !== currentPlan.id
      );
    } catch (error) {
      logger.error(
        "Error getting available downgrades",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        userId
      );
      return [];
    }
  }
}

export function createSubscriptionManager(
  supabaseClient: any,
  accessToken: string
): SubscriptionManager {
  return new SubscriptionManager(supabaseClient, accessToken);
}
