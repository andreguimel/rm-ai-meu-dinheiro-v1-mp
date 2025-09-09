import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BasicAccessBanner } from "../BasicAccessBanner";
import { BasicAccessProvider } from "../BasicAccessProvider";

describe("BasicAccessBanner", () => {
  const mockShowUpgradePrompt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not in basic access mode", () => {
    const { container } = render(
      <BasicAccessProvider
        isBasicAccess={false}
        onShowUpgradePrompt={mockShowUpgradePrompt}
      >
        <BasicAccessBanner />
      </BasicAccessProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders banner when in basic access mode", () => {
    render(
      <BasicAccessProvider
        isBasicAccess={true}
        onShowUpgradePrompt={mockShowUpgradePrompt}
      >
        <BasicAccessBanner />
      </BasicAccessProvider>
    );

    expect(screen.getByText(/Modo de visualização/)).toBeInTheDocument();
    expect(
      screen.getByText(/Seu período de teste expirou/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /pode visualizar seus dados, mas não pode criar ou editar/
      )
    ).toBeInTheDocument();
  });

  it("calls showUpgradePrompt when assinar button is clicked", () => {
    render(
      <BasicAccessProvider
        isBasicAccess={true}
        onShowUpgradePrompt={mockShowUpgradePrompt}
      >
        <BasicAccessBanner />
      </BasicAccessProvider>
    );

    fireEvent.click(screen.getByText("Assinar"));

    expect(mockShowUpgradePrompt).toHaveBeenCalledTimes(1);
  });

  it("has correct styling and icons", () => {
    render(
      <BasicAccessProvider
        isBasicAccess={true}
        onShowUpgradePrompt={mockShowUpgradePrompt}
      >
        <BasicAccessBanner />
      </BasicAccessProvider>
    );

    const banner = screen.getByRole("alert");
    expect(banner).toHaveClass("border-orange-200", "bg-orange-50");
  });
});
