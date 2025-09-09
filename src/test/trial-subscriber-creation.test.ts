import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Trial Subscriber Creation Fix", () => {
  let testUserId: string;
  let testEmail: string;

  beforeAll(async () => {
    // Create a test user
    testEmail = `test-subscriber-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: "test-password-123",
    });

    if (authError || !authData.user) {
      throw new Error("Failed to create test user for subscriber testing");
    }

    testUserId = authData.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await supabase.from("subscribers").delete().eq("user_id", testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up any existing subscriber data before each test
    await supabase.from("subscribers").delete().eq("user_id", testUserId);
  });

  describe("ensure_user_has_trial function", () => {
    it("should create trial for new user with no subscriber record", async () => {
      // Verify no subscriber record exists
      const { data: beforeSubscriber } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", testUserId)
        .single();

      expect(beforeSubscriber).toBeNull();

      // Call ensure_user_has_trial
      const { data: result, error } = await supabase.rpc(
        "ensure_user_has_trial",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(result).toBe(true);

      // Verify subscriber record was created with trial
      const { data: afterSubscriber, error: fetchError } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", testUserId)
        .single();

      expect(fetchError).toBeNull();
      expect(afterSubscriber).toBeDefined();
      expect(afterSubscriber.user_id).toBe(testUserId);
      expect(afterSubscriber.email).toBe(testEmail);
      expect(afterSubscriber.trial_start).toBeDefined();
      expect(afterSubscriber.trial_end).toBeDefined();
      expect(afterSubscriber.subscription_tier).toBe("Trial");
      expect(afterSubscriber.subscribed).toBe(false); // Trial users should not be marked as subscribed
    });

    it("should add trial to existing subscriber without trial history", async () => {
      // Create subscriber record without trial (simulating check-mercadopago-subscription behavior)
      await supabase.from("subscribers").insert({
        user_id: testUserId,
        email: testEmail,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_start: null,
        subscription_end: null,
        trial_start: null,
        trial_end: null,
      });

      // Verify subscriber exists but has no trial
      const { data: beforeSubscriber } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", testUserId)
        .single();

      expect(beforeSubscriber.trial_start).toBeNull();
      expect(beforeSubscriber.trial_end).toBeNull();

      // Call ensure_user_has_trial
      const { data: result, error } = await supabase.rpc(
        "ensure_user_has_trial",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(result).toBe(true);

      // Verify trial was added to existing subscriber
      const { data: afterSubscriber, error: fetchError } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", testUserId)
        .single();

      expect(fetchError).toBeNull();
      expect(afterSubscriber.trial_start).toBeDefined();
      expect(afterSubscriber.trial_end).toBeDefined();
      expect(afterSubscriber.subscription_tier).toBe("Trial");
      expect(afterSubscriber.subscribed).toBe(false);
    });

    it("should not create duplicate trial for user with existing trial", async () => {
      // Create subscriber with existing trial
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabase.from("subscribers").insert({
        user_id: testUserId,
        email: testEmail,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: "Trial",
        subscription_start: null,
        subscription_end: null,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
      });

      // Call ensure_user_has_trial
      const { data: result, error } = await supabase.rpc(
        "ensure_user_has_trial",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(result).toBe(false); // Should return false because trial already exists

      // Verify trial dates weren't changed
      const { data: afterSubscriber } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", testUserId)
        .single();

      expect(new Date(afterSubscriber.trial_start).getTime()).toBe(
        trialStart.getTime()
      );
      expect(new Date(afterSubscriber.trial_end).getTime()).toBe(
        trialEnd.getTime()
      );
    });
  });

  describe("debug_user_trial_status function", () => {
    it("should provide comprehensive status information", async () => {
      // Create subscriber with trial
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabase.from("subscribers").insert({
        user_id: testUserId,
        email: testEmail,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        subscription_tier: "Trial",
        subscribed: false,
      });

      // Call debug function
      const { data: debugInfo, error } = await supabase.rpc(
        "debug_user_trial_status",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(debugInfo).toBeDefined();
      expect(Array.isArray(debugInfo)).toBe(true);
      expect(debugInfo.length).toBe(1);

      const status = debugInfo[0];
      expect(status.user_exists).toBe(true);
      expect(status.subscriber_exists).toBe(true);
      expect(status.has_trial_history).toBe(true);
      expect(status.trial_currently_active).toBe(true);
      expect(status.subscription_tier).toBe("Trial");
      expect(status.subscribed).toBe(false);
    });

    it("should show correct status for user without subscriber record", async () => {
      // Don't create any subscriber record

      // Call debug function
      const { data: debugInfo, error } = await supabase.rpc(
        "debug_user_trial_status",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(debugInfo).toBeDefined();

      const status = debugInfo[0];
      expect(status.user_exists).toBe(true);
      expect(status.subscriber_exists).toBe(false);
      expect(status.has_trial_history).toBe(false);
      expect(status.trial_currently_active).toBe(false);
    });
  });

  describe("get_user_access_status with fixed logic", () => {
    it("should correctly identify trial users as having trial access", async () => {
      // Create trial user with correct settings
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabase.from("subscribers").insert({
        user_id: testUserId,
        email: testEmail,
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        subscription_tier: "Trial",
        subscribed: false, // This is the key fix - trial users should not be marked as subscribed
      });

      // Call get_user_access_status
      const { data: accessStatus, error } = await supabase.rpc(
        "get_user_access_status",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(accessStatus).toBeDefined();
      expect(Array.isArray(accessStatus)).toBe(true);
      expect(accessStatus.length).toBe(1);

      const status = accessStatus[0];
      expect(status.has_paid_subscription).toBe(false); // Trial users don't have paid subscription
      expect(status.trial_active).toBe(true); // But they have active trial
      expect(status.access_level).toBe("trial"); // Access level should be trial
      expect(status.effective_subscription).toBe(true); // They have effective access through trial
      expect(status.trial_days_remaining).toBeGreaterThan(0);
    });

    it("should correctly identify paid users", async () => {
      // Create paid user
      await supabase.from("subscribers").insert({
        user_id: testUserId,
        email: testEmail,
        subscription_tier: "Premium",
        subscribed: true, // Paid users are subscribed
        subscription_start: new Date().toISOString(),
        trial_start: null, // May or may not have trial history
        trial_end: null,
      });

      // Call get_user_access_status
      const { data: accessStatus, error } = await supabase.rpc(
        "get_user_access_status",
        {
          check_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      const status = accessStatus[0];
      expect(status.has_paid_subscription).toBe(true);
      expect(status.trial_active).toBe(false);
      expect(status.access_level).toBe("premium");
      expect(status.effective_subscription).toBe(true);
    });
  });
});
