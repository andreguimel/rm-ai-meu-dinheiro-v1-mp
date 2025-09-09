import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubscription } from "../useSubscription";
import { useAuth } from "../useAuth";
import { useToast } from "../use-toast";

// Mock dependencies
vi.mock("../useAuth");
vi.mock("../use-toast");
vi.mock("@/integrations/supabase/client");

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as vi.MockedFunction<typeof useToast>;

describe("useSubscription", () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it("should initialize with correct default values", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSubscription());

    expect(result.current.subscriptionData.subscribed).toBe(false);
    expect(result.current.subscriptionData.trial_active).toBe(false);
    expect(result.current.subscriptionData.effective_subscription).toBe(false);
    expect(result.current.subscriptionData.access_level).toBe("none");
    expect(result.current.hasActiveSubscription).toBe(false);
    expect(result.current.hasActiveTrial).toBe(false);
    expect(result.current.hasPaidSubscription).toBe(false);
    expect(result.current.accessLevel).toBe("none");
  });

  it("should provide trial data structure", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSubscription());

    expect(result.current.subscriptionData.trial_data).toEqual({
      trial_active: false,
      trial_start: null,
      trial_end: null,
      trial_days_remaining: null,
    });
  });

  it("should expose trial-related helper functions", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSubscription());

    expect(typeof result.current.startTrial).toBe("function");
    expect(typeof result.current.hasActiveSubscription).toBe("boolean");
    expect(typeof result.current.hasActiveTrial).toBe("boolean");
    expect(typeof result.current.hasPaidSubscription).toBe("boolean");
    expect(typeof result.current.accessLevel).toBe("string");
  });
});
