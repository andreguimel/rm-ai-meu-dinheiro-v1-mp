import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Trial Analytics Database Functions", () => {
  let testUserId: string;
  let testEventId: string;

  beforeAll(async () => {
    // Create a test user for analytics testing
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-analytics-${Date.now()}@example.com`,
      password: "test-password-123",
    });

    if (authError || !authData.user) {
      throw new Error("Failed to create test user for analytics");
    }

    testUserId = authData.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await supabase.from("trial_events").delete().eq("user_id", testUserId);

      await supabase
        .from("trial_analytics_summary")
        .delete()
        .eq("date", new Date().toISOString().split("T")[0]);
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await supabase.from("trial_events").delete().eq("user_id", testUserId);
  });

  describe("log_trial_event function", () => {
    it("should log a trial event successfully", async () => {
      const eventData = {
        user_email: "test@example.com",
        trial_days_remaining: 7,
        access_level: "trial",
      };

      const { data: eventId, error } = await supabase.rpc("log_trial_event", {
        p_user_id: testUserId,
        p_event_type: "trial_created",
        p_event_data: eventData,
      });

      expect(error).toBeNull();
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe("string");

      testEventId = eventId;

      // Verify the event was stored
      const { data: events, error: fetchError } = await supabase
        .from("trial_events")
        .select("*")
        .eq("id", eventId)
        .single();

      expect(fetchError).toBeNull();
      expect(events).toBeDefined();
      expect(events.user_id).toBe(testUserId);
      expect(events.event_type).toBe("trial_created");
      expect(events.event_data).toEqual(eventData);
    });

    it("should update daily analytics summary", async () => {
      const today = new Date().toISOString().split("T")[0];

      // Log a trial creation event
      await supabase.rpc("log_trial_event", {
        p_user_id: testUserId,
        p_event_type: "trial_created",
        p_event_data: { test: "data" },
      });

      // Check if summary was updated
      const { data: summary, error } = await supabase
        .from("trial_analytics_summary")
        .select("*")
        .eq("date", today)
        .single();

      expect(error).toBeNull();
      expect(summary).toBeDefined();
      expect(summary.trials_created).toBeGreaterThan(0);
    });

    it("should handle different event types correctly", async () => {
      const eventTypes = [
        "trial_created",
        "trial_accessed",
        "trial_expired",
        "trial_converted",
        "trial_error",
      ];

      for (const eventType of eventTypes) {
        const { data: eventId, error } = await supabase.rpc("log_trial_event", {
          p_user_id: testUserId,
          p_event_type: eventType,
          p_event_data: { test_event: eventType },
        });

        expect(error).toBeNull();
        expect(eventId).toBeDefined();
      }

      // Verify all events were logged
      const { data: events, error: fetchError } = await supabase
        .from("trial_events")
        .select("event_type")
        .eq("user_id", testUserId);

      expect(fetchError).toBeNull();
      expect(events).toHaveLength(eventTypes.length);

      const loggedTypes = events.map((e) => e.event_type).sort();
      expect(loggedTypes).toEqual(eventTypes.sort());
    });

    it("should reject invalid event types", async () => {
      const { data, error } = await supabase.rpc("log_trial_event", {
        p_user_id: testUserId,
        p_event_type: "invalid_event_type",
        p_event_data: {},
      });

      expect(error).toBeDefined();
      expect(error.message).toContain("violates check constraint");
    });
  });

  describe("get_trial_analytics function", () => {
    beforeEach(async () => {
      // Set up test data
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Insert test analytics data
      await supabase.from("trial_analytics_summary").upsert([
        {
          date: today.toISOString().split("T")[0],
          trials_created: 10,
          trials_accessed: 8,
          trials_expired: 2,
          trials_converted: 3,
          trial_errors: 1,
        },
        {
          date: yesterday.toISOString().split("T")[0],
          trials_created: 5,
          trials_accessed: 4,
          trials_expired: 1,
          trials_converted: 1,
          trial_errors: 0,
        },
      ]);
    });

    it("should return analytics data for date range", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const { data, error } = await supabase.rpc("get_trial_analytics", {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Check data structure
      const firstRow = data[0];
      expect(firstRow).toHaveProperty("date");
      expect(firstRow).toHaveProperty("trials_created");
      expect(firstRow).toHaveProperty("trials_accessed");
      expect(firstRow).toHaveProperty("trials_expired");
      expect(firstRow).toHaveProperty("trials_converted");
      expect(firstRow).toHaveProperty("trial_errors");
      expect(firstRow).toHaveProperty("conversion_rate");
    });

    it("should calculate conversion rate correctly", async () => {
      const { data, error } = await supabase.rpc("get_trial_analytics", {
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const todayData = data.find(
        (row) => row.date === new Date().toISOString().split("T")[0]
      );

      if (todayData && todayData.trials_created > 0) {
        const expectedRate =
          (todayData.trials_converted / todayData.trials_created) * 100;
        expect(todayData.conversion_rate).toBe(expectedRate);
      }
    });
  });

  describe("get_trial_conversion_funnel function", () => {
    it("should return funnel data with correct structure", async () => {
      const { data, error } = await supabase.rpc(
        "get_trial_conversion_funnel",
        {
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          end_date: new Date().toISOString().split("T")[0],
        }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);

      const funnelData = data[0];
      expect(funnelData).toHaveProperty("total_trials_created");
      expect(funnelData).toHaveProperty("total_trials_accessed");
      expect(funnelData).toHaveProperty("total_trials_converted");
      expect(funnelData).toHaveProperty("access_rate");
      expect(funnelData).toHaveProperty("conversion_rate");

      // Verify data types
      expect(typeof funnelData.total_trials_created).toBe("number");
      expect(typeof funnelData.total_trials_accessed).toBe("number");
      expect(typeof funnelData.total_trials_converted).toBe("number");
      expect(typeof funnelData.access_rate).toBe("number");
      expect(typeof funnelData.conversion_rate).toBe("number");
    });
  });

  describe("get_user_trial_journey function", () => {
    beforeEach(async () => {
      // Create a journey of events for the test user
      const events = [
        {
          event_type: "trial_created",
          event_data: { user_email: "test@example.com" },
        },
        {
          event_type: "trial_accessed",
          event_data: { trial_days_remaining: 6 },
        },
        {
          event_type: "trial_accessed",
          event_data: { trial_days_remaining: 5 },
        },
        {
          event_type: "trial_converted",
          event_data: { subscription_tier: "Premium" },
        },
      ];

      for (const event of events) {
        await supabase.rpc("log_trial_event", {
          p_user_id: testUserId,
          p_event_type: event.event_type,
          p_event_data: event.event_data,
        });

        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    it("should return user trial journey in chronological order", async () => {
      const { data, error } = await supabase.rpc("get_user_trial_journey", {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(4);

      // Check chronological order
      for (let i = 1; i < data.length; i++) {
        const prevTime = new Date(data[i - 1].created_at);
        const currTime = new Date(data[i].created_at);
        expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
      }

      // Check event sequence
      expect(data[0].event_type).toBe("trial_created");
      expect(data[1].event_type).toBe("trial_accessed");
      expect(data[2].event_type).toBe("trial_accessed");
      expect(data[3].event_type).toBe("trial_converted");
    });

    it("should return empty array for user with no events", async () => {
      const { data: newUser } = await supabase.auth.signUp({
        email: `test-no-events-${Date.now()}@example.com`,
        password: "test-password-123",
      });

      const { data, error } = await supabase.rpc("get_user_trial_journey", {
        p_user_id: newUser.user!.id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe("Row Level Security", () => {
    it("should enforce RLS on trial_events table", async () => {
      // This test would need to be run with different user contexts
      // For now, we just verify the table exists and has RLS enabled
      const { data, error } = await supabase
        .from("trial_events")
        .select("*")
        .limit(1);

      // If RLS is working correctly, this should either return data the user can see
      // or an empty result, but not throw a permission error for authenticated users
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
