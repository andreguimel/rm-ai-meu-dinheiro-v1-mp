import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBasicAccessControl } from "../useBasicAccessControl";
import { useBasicAccess } from "@/components/BasicAccessProvider";
import { useToast } from "@/hooks/use-toast";

// Mock the dependencies
vi.mock("@/components/BasicAccessProvider");
vi.mock("@/hooks/use-toast");

const mockUseBasicAccess = useBasicAccess as vi.MockedFunction<
  typeof useBasicAccess
>;
const mockUseToast = useToast as vi.MockedFunction<typeof useToast>;

describe("useBasicAccessControl", () => {
  const mockShowUpgradePrompt = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockReturnValue({
      toast: mockToast,
    } as any);
  });

  it("should allow actions when not in basic access mode", () => {
    mockUseBasicAccess.mockReturnValue({
      isBasicAccess: false,
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    const { result } = renderHook(() => useBasicAccessControl());

    const canPerformAction = result.current.checkAccess("test action");

    expect(canPerformAction).toBe(true);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("should block actions when in basic access mode", () => {
    mockUseBasicAccess.mockReturnValue({
      isBasicAccess: true,
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    const { result } = renderHook(() => useBasicAccessControl());

    const canPerformAction = result.current.checkAccess("test action");

    expect(canPerformAction).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Acesso limitado",
      description: "Para test action, você precisa assinar o plano premium.",
      variant: "destructive",
      action: expect.any(Object),
    });
  });

  it("should wrap actions correctly when not in basic access mode", () => {
    mockUseBasicAccess.mockReturnValue({
      isBasicAccess: false,
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    const { result } = renderHook(() => useBasicAccessControl());

    const mockAction = vi.fn();
    const wrappedAction = result.current.wrapAction(mockAction, "test action");

    act(() => {
      wrappedAction("arg1", "arg2");
    });

    expect(mockAction).toHaveBeenCalledWith("arg1", "arg2");
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("should prevent wrapped actions when in basic access mode", () => {
    mockUseBasicAccess.mockReturnValue({
      isBasicAccess: true,
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    const { result } = renderHook(() => useBasicAccessControl());

    const mockAction = vi.fn();
    const wrappedAction = result.current.wrapAction(mockAction, "test action");

    act(() => {
      wrappedAction("arg1", "arg2");
    });

    expect(mockAction).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: "Acesso limitado",
      description: "Para test action, você precisa assinar o plano premium.",
      variant: "destructive",
      action: expect.any(Object),
    });
  });

  it("should use default action name when none provided", () => {
    mockUseBasicAccess.mockReturnValue({
      isBasicAccess: true,
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    const { result } = renderHook(() => useBasicAccessControl());

    result.current.checkAccess();

    expect(mockToast).toHaveBeenCalledWith({
      title: "Acesso limitado",
      description: "Para esta ação, você precisa assinar o plano premium.",
      variant: "destructive",
      action: expect.any(Object),
    });
  });

  it("should return correct basic access state", () => {
    mockUseBasicAccess.mockReturnValue({
      isBasicAccess: true,
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    const { result } = renderHook(() => useBasicAccessControl());

    expect(result.current.isBasicAccess).toBe(true);
    expect(result.current.showUpgradePrompt).toBe(mockShowUpgradePrompt);
  });
});
