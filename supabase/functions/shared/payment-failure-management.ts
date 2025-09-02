import { createFunctionLogger } from "./logger.ts";
import { mercadoPagoAPICall, parseJSONWithRetry } from "./retry.ts";
import { subscriptionCache, getCacheKey } from "./cache.ts";

const logger = createFunctionLogger("payment-failure-management");

export interface PaymentFailureData {
  userId: string;
  paymentId: string;
  subscriptionId?: string;
  failureReason: string;
  failureCode?: string;
  amount: number;
  currency: string;
  attemptNumber: number;
  nextRetryDate?: Date;
  maxRetryAttempts: number;
}

export interface DunningConfig {
  maxRetryAttempts: number;
  retryIntervals: number[]; // Days between retries
  gracePeriodDays: number;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
}

export const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  maxRetryAttempts: 3,
  retryIntervals: [3, 7, 14], // Retry after 3, 7, and 14 days
  gracePeriodDays: 7,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
};

export class PaymentFailureManager {
  private supabaseClient: any;
  private accessToken: string;
  private config: DunningConfig;

  constructor(
    supabaseClient: any,
    accessToken: string,
    config: DunningConfig = DEFAULT_DUNNING_CONFIG
  ) {
    this.supabaseClient = supabaseClient;
    this.accessToken = accessToken;
    this.config = config;
  }

  async handlePaymentFailure(failureData: PaymentFailureData): Promise<void> {
    const { userId, paymentId, failureReason, attemptNumber } = failureData;

    try {
      logger.info(
        "Handling payment failure",
        {
          userId,
          paymentId,
          failureReason,
          attemptNumber,
        },
        userId
      );

      // Record the failure
      await this.recordPaymentFailure(failureData);

      // Determine next action based on attempt number and failure reason
      if (this.shouldRetryPayment(failureData)) {
        await this.schedulePaymentRetry(failureData);
      } else {
        await this.handleMaxRetriesReached(failureData);
      }

      // Send appropriate notifications
      await this.sendFailureNotification(failureData);

      // Update subscription status if needed
      await this.updateSubscriptionStatus(failureData);
    } catch (error) {
      logger.error(
        "Error handling payment failure",
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
          paymentId,
        },
        userId
      );
    }
  }

  private async recordPaymentFailure(
    failureData: PaymentFailureData
  ): Promise<void> {
    try {
      await this.supabaseClient.from("payment_failures").insert([
        {
          user_id: failureData.userId,
          payment_id: failureData.paymentId,
          subscription_id: failureData.subscriptionId,
          failure_reason: failureData.failureReason,
          failure_code: failureData.failureCode,
          amount: failureData.amount,
          currency: failureData.currency,
          attempt_number: failureData.attemptNumber,
          next_retry_date: failureData.nextRetryDate?.toISOString(),
          max_retry_attempts: failureData.maxRetryAttempts,
          created_at: new Date().toISOString(),
        },
      ]);

      logger.info(
        "Payment failure recorded",
        {
          userId: failureData.userId,
          paymentId: failureData.paymentId,
          attemptNumber: failureData.attemptNumber,
        },
        failureData.userId
      );
    } catch (error) {
      logger.error(
        "Failed to record payment failure",
        {
          error: error instanceof Error ? error.message : String(error),
          userId: failureData.userId,
        },
        failureData.userId
      );
    }
  }

  private shouldRetryPayment(failureData: PaymentFailureData): boolean {
    // Don't retry if we've reached max attempts
    if (failureData.attemptNumber >= this.config.maxRetryAttempts) {
      return false;
    }

    // Don't retry for certain failure reasons that are unlikely to succeed
    const nonRetryableReasons = [
      "insufficient_funds_temporary", // May succeed later
      "card_declined_generic",
      "processing_error",
    ];

    const permanentFailureReasons = [
      "card_expired",
      "invalid_card",
      "card_declined_permanent",
      "fraudulent",
    ];

    if (
      permanentFailureReasons.some((reason) =>
        failureData.failureReason.toLowerCase().includes(reason)
      )
    ) {
      return false;
    }

    return true;
  }

  private async schedulePaymentRetry(
    failureData: PaymentFailureData
  ): Promise<void> {
    const retryIntervalIndex = Math.min(
      failureData.attemptNumber - 1,
      this.config.retryIntervals.length - 1
    );
    const retryIntervalDays = this.config.retryIntervals[retryIntervalIndex];

    const nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + retryIntervalDays);

    try {
      // Update the failure record with next retry date
      await this.supabaseClient
        .from("payment_failures")
        .update({
          next_retry_date: nextRetryDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("payment_id", failureData.paymentId)
        .eq("attempt_number", failureData.attemptNumber);

      logger.info(
        "Payment retry scheduled",
        {
          userId: failureData.userId,
          paymentId: failureData.paymentId,
          nextRetryDate: nextRetryDate.toISOString(),
          attemptNumber: failureData.attemptNumber + 1,
        },
        failureData.userId
      );
    } catch (error) {
      logger.error(
        "Failed to schedule payment retry",
        {
          error: error instanceof Error ? error.message : String(error),
          userId: failureData.userId,
        },
        failureData.userId
      );
    }
  }

  private async handleMaxRetriesReached(
    failureData: PaymentFailureData
  ): Promise<void> {
    try {
      // Mark subscription as past due or cancelled based on grace period
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + this.config.gracePeriodDays
      );

      await this.supabaseClient
        .from("subscribers")
        .update({
          subscription_status: "past_due",
          grace_period_end: gracePeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", failureData.userId);

      // Invalidate cache
      subscriptionCache.invalidate(
        getCacheKey.subscription(failureData.userId)
      );

      logger.warn(
        "Max payment retries reached, subscription marked as past due",
        {
          userId: failureData.userId,
          paymentId: failureData.paymentId,
          gracePeriodEnd: gracePeriodEnd.toISOString(),
        },
        failureData.userId
      );
    } catch (error) {
      logger.error(
        "Failed to handle max retries reached",
        {
          error: error instanceof Error ? error.message : String(error),
          userId: failureData.userId,
        },
        failureData.userId
      );
    }
  }

  private async sendFailureNotification(
    failureData: PaymentFailureData
  ): Promise<void> {
    try {
      if (!this.config.enableEmailNotifications) {
        return;
      }

      const notificationType = this.getNotificationType(failureData);

      // Create notification record
      await this.supabaseClient.from("user_notifications").insert([
        {
          user_id: failureData.userId,
          type: notificationType,
          title: this.getNotificationTitle(failureData),
          message: this.getNotificationMessage(failureData),
          data: {
            paymentId: failureData.paymentId,
            amount: failureData.amount,
            currency: failureData.currency,
            attemptNumber: failureData.attemptNumber,
            nextRetryDate: failureData.nextRetryDate?.toISOString(),
          },
          created_at: new Date().toISOString(),
        },
      ]);

      logger.info(
        "Payment failure notification sent",
        {
          userId: failureData.userId,
          notificationType,
          attemptNumber: failureData.attemptNumber,
        },
        failureData.userId
      );
    } catch (error) {
      logger.error(
        "Failed to send failure notification",
        {
          error: error instanceof Error ? error.message : String(error),
          userId: failureData.userId,
        },
        failureData.userId
      );
    }
  }

  private getNotificationType(failureData: PaymentFailureData): string {
    if (failureData.attemptNumber >= this.config.maxRetryAttempts) {
      return "payment_failure_final";
    } else if (failureData.attemptNumber === 1) {
      return "payment_failure_first";
    } else {
      return "payment_failure_retry";
    }
  }

  private getNotificationTitle(failureData: PaymentFailureData): string {
    if (failureData.attemptNumber >= this.config.maxRetryAttempts) {
      return "Pagamento falhado - Ação necessária";
    } else if (failureData.attemptNumber === 1) {
      return "Problema com seu pagamento";
    } else {
      return `Tentativa de pagamento ${failureData.attemptNumber} falhada`;
    }
  }

  private getNotificationMessage(failureData: PaymentFailureData): string {
    const currencySymbol =
      failureData.currency.toUpperCase() === "BRL"
        ? "R$"
        : failureData.currency;
    const amount = (failureData.amount / 100).toFixed(2);

    if (failureData.attemptNumber >= this.config.maxRetryAttempts) {
      return (
        `Não conseguimos processar seu pagamento de ${currencySymbol} ${amount}. ` +
        `Sua assinatura foi suspensa temporariamente. ` +
        `Atualize seu método de pagamento para continuar usando nossos serviços.`
      );
    } else if (failureData.attemptNumber === 1) {
      return (
        `Houve um problema ao processar seu pagamento de ${currencySymbol} ${amount}. ` +
        `Tentaremos novamente em alguns dias. ` +
        `Se o problema persistir, verifique seu método de pagamento.`
      );
    } else {
      const nextRetry = failureData.nextRetryDate
        ? new Date(failureData.nextRetryDate).toLocaleDateString("pt-BR")
        : "em breve";
      return (
        `Ainda não conseguimos processar seu pagamento de ${currencySymbol} ${amount}. ` +
        `Nossa próxima tentativa será em ${nextRetry}. ` +
        `Considere atualizar seu método de pagamento.`
      );
    }
  }

  private async updateSubscriptionStatus(
    failureData: PaymentFailureData
  ): Promise<void> {
    try {
      let newStatus = "active";
      let suspendedAt = null;

      if (failureData.attemptNumber >= this.config.maxRetryAttempts) {
        newStatus = "past_due";
      } else if (failureData.attemptNumber > 1) {
        newStatus = "payment_pending";
      }

      await this.supabaseClient
        .from("subscribers")
        .update({
          subscription_status: newStatus,
          last_payment_status: "failed",
          last_payment_failure_reason: failureData.failureReason,
          payment_retry_count: failureData.attemptNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", failureData.userId);

      // Invalidate cache
      subscriptionCache.invalidate(
        getCacheKey.subscription(failureData.userId)
      );

      logger.info(
        "Subscription status updated after payment failure",
        {
          userId: failureData.userId,
          newStatus,
          attemptNumber: failureData.attemptNumber,
        },
        failureData.userId
      );
    } catch (error) {
      logger.error(
        "Failed to update subscription status",
        {
          error: error instanceof Error ? error.message : String(error),
          userId: failureData.userId,
        },
        failureData.userId
      );
    }
  }

  async processRetryPayments(): Promise<void> {
    try {
      const now = new Date();

      // Get all payments that are due for retry
      const { data: retryPayments } = await this.supabaseClient
        .from("payment_failures")
        .select("*")
        .lte("next_retry_date", now.toISOString())
        .is("processed_at", null)
        .lt("attempt_number", this.config.maxRetryAttempts);

      if (!retryPayments || retryPayments.length === 0) {
        logger.info("No payments due for retry", {});
        return;
      }

      logger.info("Processing retry payments", { count: retryPayments.length });

      for (const payment of retryPayments) {
        await this.retryPayment(payment);
      }
    } catch (error) {
      logger.error("Error processing retry payments", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async retryPayment(paymentFailure: any): Promise<void> {
    try {
      // Mark as processed to prevent duplicate processing
      await this.supabaseClient
        .from("payment_failures")
        .update({
          processed_at: new Date().toISOString(),
        })
        .eq("id", paymentFailure.id);

      // Attempt to create a new payment
      const retryResponse = await mercadoPagoAPICall(
        "https://api.mercadopago.com/v1/payments",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction_amount: paymentFailure.amount / 100,
            description: `Retry payment for subscription - Attempt ${
              paymentFailure.attempt_number + 1
            }`,
            external_reference: paymentFailure.user_id,
            notification_url: globalThis.Deno?.env.get("WEBHOOK_URL"),
            // Additional payment details would be retrieved from the original payment or subscription
          }),
        }
      );

      if (retryResponse.ok) {
        const newPayment = await parseJSONWithRetry(retryResponse);
        logger.info(
          "Payment retry initiated",
          {
            originalPaymentId: paymentFailure.payment_id,
            newPaymentId: newPayment.id,
            userId: paymentFailure.user_id,
            attemptNumber: paymentFailure.attempt_number + 1,
          },
          paymentFailure.user_id
        );
      } else {
        logger.warn(
          "Payment retry failed",
          {
            originalPaymentId: paymentFailure.payment_id,
            userId: paymentFailure.user_id,
            status: retryResponse.status,
          },
          paymentFailure.user_id
        );

        // Handle the failure for the retry
        await this.handlePaymentFailure({
          userId: paymentFailure.user_id,
          paymentId: paymentFailure.payment_id,
          subscriptionId: paymentFailure.subscription_id,
          failureReason: "retry_failed",
          amount: paymentFailure.amount,
          currency: paymentFailure.currency,
          attemptNumber: paymentFailure.attempt_number + 1,
          maxRetryAttempts: this.config.maxRetryAttempts,
        });
      }
    } catch (error) {
      logger.error(
        "Error retrying payment",
        {
          error: error instanceof Error ? error.message : String(error),
          paymentId: paymentFailure.payment_id,
          userId: paymentFailure.user_id,
        },
        paymentFailure.user_id
      );
    }
  }

  async getPaymentFailureStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const { data: failures } = await this.supabaseClient
        .from("payment_failures")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const totalFailures = failures?.length || 0;
      const failuresByReason =
        failures?.reduce((acc: any, failure: any) => {
          acc[failure.failure_reason] = (acc[failure.failure_reason] || 0) + 1;
          return acc;
        }, {}) || {};

      const retriesSuccessful =
        failures?.filter((f: any) => f.attempt_number > 1).length || 0;
      const retrySuccessRate =
        totalFailures > 0 ? retriesSuccessful / totalFailures : 0;

      return {
        totalFailures,
        failuresByReason,
        retriesSuccessful,
        retrySuccessRate,
        averageAttempts:
          failures?.reduce((sum: number, f: any) => sum + f.attempt_number, 0) /
            totalFailures || 0,
      };
    } catch (error) {
      logger.error("Error getting payment failure stats", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalFailures: 0,
        failuresByReason: {},
        retriesSuccessful: 0,
        retrySuccessRate: 0,
        averageAttempts: 0,
      };
    }
  }
}

export function createPaymentFailureManager(
  supabaseClient: any,
  accessToken: string,
  config?: DunningConfig
): PaymentFailureManager {
  return new PaymentFailureManager(supabaseClient, accessToken, config);
}
