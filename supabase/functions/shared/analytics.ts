export interface PaymentMetrics {
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  averageTransactionValue: number;
  conversionRate: number;
  churnRate: number;
}

export interface SubscriptionMetrics {
  activeSubscriptions: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  trialConversions: number;
  upgrades: number;
  downgrades: number;
}

export interface UserBehaviorMetrics {
  averageSessionDuration: number;
  featuresUsed: Record<string, number>;
  retentionRate: number;
  engagementScore: number;
}

export interface AnalyticsEvent {
  event_type: string;
  user_id?: string;
  properties: Record<string, any>;
  timestamp: string;
  session_id?: string;
  page_url?: string;
  referrer?: string;
}

export class AnalyticsTracker {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.supabaseClient.from("analytics_events").insert([
        {
          event_type: event.event_type,
          user_id: event.user_id,
          properties: event.properties,
          timestamp: event.timestamp,
          session_id: event.session_id,
          page_url: event.page_url,
          referrer: event.referrer,
        },
      ]);
    } catch (error) {
      console.error("Failed to track analytics event:", error);
    }
  }

  async trackSubscriptionEvent(
    eventType:
      | "subscription_created"
      | "subscription_cancelled"
      | "subscription_upgraded"
      | "subscription_downgraded",
    userId: string,
    subscriptionData: any
  ): Promise<void> {
    await this.trackEvent({
      event_type: eventType,
      user_id: userId,
      properties: {
        subscription_id: subscriptionData.id,
        plan: subscriptionData.plan,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        trial_end: subscriptionData.trial_end,
      },
      timestamp: new Date().toISOString(),
    });
  }

  async trackPaymentEvent(
    eventType: "payment_succeeded" | "payment_failed" | "payment_refunded",
    userId: string,
    paymentData: any
  ): Promise<void> {
    await this.trackEvent({
      event_type: eventType,
      user_id: userId,
      properties: {
        payment_id: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.payment_method,
        failure_reason: paymentData.failure_reason,
      },
      timestamp: new Date().toISOString(),
    });
  }

  async getPaymentMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMetrics> {
    try {
      const { data: events } = await this.supabaseClient
        .from("analytics_events")
        .select("*")
        .in("event_type", ["payment_succeeded", "payment_failed"])
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      const successfulPayments =
        events?.filter((e) => e.event_type === "payment_succeeded") || [];
      const failedPayments =
        events?.filter((e) => e.event_type === "payment_failed") || [];

      const totalRevenue = successfulPayments.reduce((sum, payment) => {
        return sum + (payment.properties?.amount || 0);
      }, 0);

      const averageTransactionValue =
        successfulPayments.length > 0
          ? totalRevenue / successfulPayments.length
          : 0;

      const conversionRate =
        successfulPayments.length + failedPayments.length > 0
          ? successfulPayments.length /
            (successfulPayments.length + failedPayments.length)
          : 0;

      // Calculate churn rate (simplified - would need more complex logic for production)
      const { data: subscriptions } = await this.supabaseClient
        .from("analytics_events")
        .select("*")
        .in("event_type", ["subscription_created", "subscription_cancelled"])
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      const newSubscriptions =
        subscriptions?.filter((s) => s.event_type === "subscription_created")
          .length || 0;
      const cancelledSubscriptions =
        subscriptions?.filter((s) => s.event_type === "subscription_cancelled")
          .length || 0;

      const churnRate =
        newSubscriptions > 0 ? cancelledSubscriptions / newSubscriptions : 0;

      return {
        totalRevenue,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        averageTransactionValue,
        conversionRate,
        churnRate,
      };
    } catch (error) {
      console.error("Failed to get payment metrics:", error);
      return {
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        averageTransactionValue: 0,
        conversionRate: 0,
        churnRate: 0,
      };
    }
  }

  async getSubscriptionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<SubscriptionMetrics> {
    try {
      const { data: events } = await this.supabaseClient
        .from("analytics_events")
        .select("*")
        .in("event_type", [
          "subscription_created",
          "subscription_cancelled",
          "subscription_upgraded",
          "subscription_downgraded",
        ])
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      const newSubscriptions =
        events?.filter((e) => e.event_type === "subscription_created").length ||
        0;
      const cancelledSubscriptions =
        events?.filter((e) => e.event_type === "subscription_cancelled")
          .length || 0;
      const upgrades =
        events?.filter((e) => e.event_type === "subscription_upgraded")
          .length || 0;
      const downgrades =
        events?.filter((e) => e.event_type === "subscription_downgraded")
          .length || 0;

      // Get current active subscriptions
      const { data: activeSubscribers } = await this.supabaseClient
        .from("subscribers")
        .select("count")
        .eq("subscribed", true);

      const activeSubscriptions = activeSubscribers?.[0]?.count || 0;

      // Calculate trial conversions (simplified)
      const trialConversions = Math.floor(newSubscriptions * 0.7); // Estimate based on industry average

      return {
        activeSubscriptions,
        newSubscriptions,
        cancelledSubscriptions,
        trialConversions,
        upgrades,
        downgrades,
      };
    } catch (error) {
      console.error("Failed to get subscription metrics:", error);
      return {
        activeSubscriptions: 0,
        newSubscriptions: 0,
        cancelledSubscriptions: 0,
        trialConversions: 0,
        upgrades: 0,
        downgrades: 0,
      };
    }
  }

  async getUserBehaviorMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<UserBehaviorMetrics> {
    try {
      const { data: events } = await this.supabaseClient
        .from("analytics_events")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      // Calculate feature usage
      const featuresUsed: Record<string, number> = {};
      events?.forEach((event) => {
        if (event.event_type.startsWith("feature_")) {
          const feature = event.event_type.replace("feature_", "");
          featuresUsed[feature] = (featuresUsed[feature] || 0) + 1;
        }
      });

      // Calculate average session duration (simplified)
      const sessionEvents = events?.filter((e) => e.session_id) || [];
      const sessionDurations = new Map<string, { start: Date; end: Date }>();

      sessionEvents.forEach((event) => {
        const sessionId = event.session_id!;
        const timestamp = new Date(event.timestamp);

        if (!sessionDurations.has(sessionId)) {
          sessionDurations.set(sessionId, { start: timestamp, end: timestamp });
        } else {
          const session = sessionDurations.get(sessionId)!;
          if (timestamp < session.start) session.start = timestamp;
          if (timestamp > session.end) session.end = timestamp;
        }
      });

      const totalDuration = Array.from(sessionDurations.values()).reduce(
        (sum, session) =>
          sum + (session.end.getTime() - session.start.getTime()),
        0
      );

      const averageSessionDuration =
        sessionDurations.size > 0
          ? totalDuration / sessionDurations.size / 1000 // Convert to seconds
          : 0;

      // Calculate retention rate (simplified - would need more complex logic)
      const uniqueUsers = new Set(events?.map((e) => e.user_id).filter(Boolean))
        .size;
      const retentionRate = uniqueUsers > 0 ? 0.85 : 0; // Placeholder

      // Calculate engagement score based on feature usage
      const totalFeatureUsage = Object.values(featuresUsed).reduce(
        (sum, count) => sum + count,
        0
      );
      const engagementScore =
        uniqueUsers > 0 ? totalFeatureUsage / uniqueUsers : 0;

      return {
        averageSessionDuration,
        featuresUsed,
        retentionRate,
        engagementScore,
      };
    } catch (error) {
      console.error("Failed to get user behavior metrics:", error);
      return {
        averageSessionDuration: 0,
        featuresUsed: {},
        retentionRate: 0,
        engagementScore: 0,
      };
    }
  }
}

export function createAnalyticsTracker(supabaseClient: any): AnalyticsTracker {
  return new AnalyticsTracker(supabaseClient);
}
