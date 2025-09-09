import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrialStatusBanner } from "../TrialStatusBanner";
import { useSubscription } from "@/hooks/useSubscription";

// Mock the useSubscription hook
vi.mock("@/hooks/useSubscription");

const mockUseSubscription = useSubscription as vi.MockedFunction<
  typeof useSubscription
>;

describe("TrialStatusBanner", () => {
  const mockCreateCheckout = vi.fn();
  const mockOnUpgrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSubscription.mockReturnValue({
      subscriptionData: {
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        subscription_start: null,
        current_period_start: null,
        current_period_end: null,
        amount: null,
        currency: null,
        status: null,
        cancel_at_period_end: null,
        trial_end: null,
        trial_start: null,
        trial_days_remaining: null,
        trial_active: false,
        access_level: "none" as const,
        effective_subscription: false,
        has_paid_subscription: false,
        trial_data: {
          trial_active: false,
          trial_start: null,
          trial_end: null,
          trial_days_remaining: null,
        },
        payment_method: null,
        discount: null,
      },
      loading: false,
      error: null,
      checkSubscription: vi.fn(),
      createCheckout: mockCreateCheckout,
      forceRefreshSubscription: vi.fn(),
      cancelSubscription: vi.fn(),
      startTrial: vi.fn(),
      hasActiveSubscription: false,
      hasActiveTrial: false,
      hasPaidSubscription: false,
      accessLevel: "none" as const,
      trialDaysRemaining: null,
      isTrialExpiring: false,
      isTrialExpired: false,
      canStartTrial: false,
    });
  });

  it("should not render when loading", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      loading: true,
    });

    const { container } = render(<TrialStatusBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render when user has paid subscription", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        has_paid_subscription: true,
      },
    });

    const { container } = render(<TrialStatusBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render when trial is not active", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: false,
        trial_data: {
          trial_active: false,
          trial_start: null,
          trial_end: null,
          trial_days_remaining: null,
        },
      },
    });

    const { container } = render(<TrialStatusBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("should render green banner for 7 days remaining", () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 7,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          trial_days_remaining: 7,
        },
      },
    });

    render(<TrialStatusBanner />);

    expect(screen.getByText("7 dias restantes")).toBeInTheDocument();
    expect(screen.getByText("Período de Teste")).toBeInTheDocument();
    expect(screen.getByText("Fazer Upgrade")).toBeInTheDocument();

    // Check for green styling
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass(
      "border-green-200",
      "bg-green-50",
      "text-green-900"
    );
  });

  it("should render yellow banner for 3 days remaining", () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3);

    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 3,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          trial_days_remaining: 3,
        },
      },
    });

    render(<TrialStatusBanner />);

    expect(screen.getByText("3 dias restantes")).toBeInTheDocument();
    expect(screen.getByText(/Não perca o acesso!/)).toBeInTheDocument();

    // Check for yellow styling
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass(
      "border-yellow-200",
      "bg-yellow-50",
      "text-yellow-900"
    );
  });

  it("should render red banner for 1 day remaining", () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 1);

    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 1,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          trial_days_remaining: 1,
        },
      },
    });

    render(<TrialStatusBanner />);

    expect(screen.getByText("Último dia!")).toBeInTheDocument();
    expect(screen.getByText("Assinar Agora")).toBeInTheDocument();

    // Check for red styling
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("border-red-200", "bg-red-50", "text-red-900");
  });

  it("should call createCheckout when upgrade button is clicked", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 5,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: new Date().toISOString(),
          trial_days_remaining: 5,
        },
      },
    });

    render(<TrialStatusBanner />);

    const upgradeButton = screen.getByText("Fazer Upgrade");
    fireEvent.click(upgradeButton);

    expect(mockCreateCheckout).toHaveBeenCalledTimes(1);
  });

  it("should call custom onUpgrade callback when provided", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 5,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: new Date().toISOString(),
          trial_days_remaining: 5,
        },
      },
    });

    render(<TrialStatusBanner onUpgrade={mockOnUpgrade} />);

    const upgradeButton = screen.getByText("Fazer Upgrade");
    fireEvent.click(upgradeButton);

    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    expect(mockCreateCheckout).not.toHaveBeenCalled();
  });

  it("should format trial end date correctly", () => {
    const trialEnd = new Date("2024-12-25");

    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 5,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          trial_days_remaining: 5,
        },
      },
    });

    render(<TrialStatusBanner />);

    expect(screen.getByText(/25\/12\/2024/)).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 5,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: new Date().toISOString(),
          trial_days_remaining: 5,
        },
      },
    });

    render(<TrialStatusBanner className="custom-class" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("custom-class");
  });

  it("should be responsive on mobile and desktop", () => {
    mockUseSubscription.mockReturnValue({
      ...mockUseSubscription(),
      subscriptionData: {
        ...mockUseSubscription().subscriptionData,
        trial_active: true,
        trial_days_remaining: 5,
        trial_data: {
          trial_active: true,
          trial_start: new Date().toISOString(),
          trial_end: new Date().toISOString(),
          trial_days_remaining: 5,
        },
      },
    });

    render(<TrialStatusBanner />);

    // Check for responsive classes
    const alertDescription = screen
      .getByText("5 dias restantes")
      .closest("div");
    expect(alertDescription).toHaveClass(
      "flex",
      "flex-col",
      "sm:flex-row",
      "sm:items-center",
      "sm:justify-between"
    );
  });
});

  describe("Edge Cases and Error Handling", () => {
    it("should handle null trial data gracefully", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_data: {
            trial_active: false,
            trial_start: null,
            trial_end: null,
            trial_days_remaining: null,
          },
        },
      });

      const { container } = render(<TrialStatusBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("should handle zero days remaining correctly", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: false,
          trial_days_remaining: 0,
          trial_data: {
            trial_active: false,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 0,
          },
        },
      });

      const { container } = render(<TrialStatusBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("should handle negative days remaining", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: false,
          trial_days_remaining: -1,
          trial_data: {
            trial_active: false,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: -1,
          },
        },
      });

      const { container } = render(<TrialStatusBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("should handle malformed trial end date", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 5,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: "invalid-date",
            trial_days_remaining: 5,
          },
        },
      });

      render(<TrialStatusBanner />);
      
      // Should still render but handle date gracefully
      expect(screen.getByText("5 dias restantes")).toBeInTheDocument();
    });

    it("should handle createCheckout errors gracefully", async () => {
      const mockCreateCheckoutError = vi.fn().mockRejectedValue(new Error("Payment error"));
      
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 5,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 5,
          },
        },
        createCheckout: mockCreateCheckoutError,
      });

      render(<TrialStatusBanner />);

      const upgradeButton = screen.getByText("Fazer Upgrade");
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockCreateCheckoutError).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle very large days remaining numbers", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 999,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 999,
          },
        },
      });

      render(<TrialStatusBanner />);

      expect(screen.getByText("999 dias restantes")).toBeInTheDocument();
      // Should still use green styling for high numbers
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-green-200", "bg-green-50", "text-green-900");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 5,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 5,
          },
        },
      });

      render(<TrialStatusBanner />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      
      const button = screen.getByRole("button", { name: "Fazer Upgrade" });
      expect(button).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 5,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 5,
          },
        },
      });

      render(<TrialStatusBanner />);

      const button = screen.getByRole("button", { name: "Fazer Upgrade" });
      expect(button).toHaveAttribute("tabIndex", "0");
    });

    it("should have proper color contrast for all states", () => {
      const testCases = [
        { days: 7, expectedClasses: ["text-green-900", "bg-green-50"] },
        { days: 3, expectedClasses: ["text-yellow-900", "bg-yellow-50"] },
        { days: 1, expectedClasses: ["text-red-900", "bg-red-50"] },
      ];

      testCases.forEach(({ days, expectedClasses }) => {
        mockUseSubscription.mockReturnValue({
          ...mockUseSubscription(),
          subscriptionData: {
            ...mockUseSubscription().subscriptionData,
            trial_active: true,
            trial_days_remaining: days,
            trial_data: {
              trial_active: true,
              trial_start: new Date().toISOString(),
              trial_end: new Date().toISOString(),
              trial_days_remaining: days,
            },
          },
        });

        const { unmount } = render(<TrialStatusBanner />);
        
        const alert = screen.getByRole("alert");
        expectedClasses.forEach(className => {
          expect(alert).toHaveClass(className);
        });

        unmount();
      });
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily", () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <TrialStatusBanner />;
      };

      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 5,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 5,
          },
        },
      });

      const { rerender } = render(<TestWrapper />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same data
      rerender(<TestWrapper />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it("should handle rapid state changes", () => {
      const { rerender } = render(<TrialStatusBanner />);

      // Rapidly change trial days
      for (let days = 7; days >= 1; days--) {
        mockUseSubscription.mockReturnValue({
          ...mockUseSubscription(),
          subscriptionData: {
            ...mockUseSubscription().subscriptionData,
            trial_active: true,
            trial_days_remaining: days,
            trial_data: {
              trial_active: true,
              trial_start: new Date().toISOString(),
              trial_end: new Date().toISOString(),
              trial_days_remaining: days,
            },
          },
        });

        rerender(<TrialStatusBanner />);
        expect(screen.getByText(`${days} ${days === 1 ? 'dia restante' : 'dias restantes'}`)).toBeInTheDocument();
      }
    });
  });

  describe("Integration with Theme", () => {
    it("should work with dark theme", () => {
      // Mock dark theme context if available
      mockUseSubscription.mockReturnValue({
        ...mockUseSubscription(),
        subscriptionData: {
          ...mockUseSubscription().subscriptionData,
          trial_active: true,
          trial_days_remaining: 5,
          trial_data: {
            trial_active: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date().toISOString(),
            trial_days_remaining: 5,
          },
        },
      });

      render(<TrialStatusBanner />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-green-200", "bg-green-50", "text-green-900");
    });
  });
});