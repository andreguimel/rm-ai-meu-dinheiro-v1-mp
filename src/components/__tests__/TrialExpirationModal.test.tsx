import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TrialExpirationModal } from "../TrialExpirationModal";

describe("TrialExpirationModal", () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    onUpgrade: vi.fn(),
    isExpired: false,
    daysRemaining: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trial expiring modal correctly", () => {
    render(<TrialExpirationModal {...mockProps} />);

    expect(screen.getByText("Seu teste expira em 3 dias")).toBeInTheDocument();
    expect(screen.getByText(/Não perca o acesso/)).toBeInTheDocument();
    expect(screen.getByText("Assinar por R$ 9,90/mês")).toBeInTheDocument();
    expect(screen.getByText("Lembrar mais tarde")).toBeInTheDocument();
  });

  it("renders expired trial modal correctly", () => {
    render(<TrialExpirationModal {...mockProps} isExpired={true} />);

    expect(screen.getByText("Período de teste expirado")).toBeInTheDocument();
    expect(
      screen.getByText(/Seu período de teste de 7 dias chegou ao fim/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Continuar com acesso limitado")
    ).toBeInTheDocument();
  });

  it("calls onUpgrade when upgrade button is clicked", () => {
    render(<TrialExpirationModal {...mockProps} />);

    fireEvent.click(screen.getByText("Assinar por R$ 9,90/mês"));

    expect(mockProps.onUpgrade).toHaveBeenCalledTimes(1);
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange when continue with limited access is clicked", () => {
    render(<TrialExpirationModal {...mockProps} isExpired={true} />);

    fireEvent.click(screen.getByText("Continuar com acesso limitado"));

    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows correct days remaining text for singular day", () => {
    render(<TrialExpirationModal {...mockProps} daysRemaining={1} />);

    expect(screen.getByText("Seu teste expira em 1 dia")).toBeInTheDocument();
  });

  it("shows premium features list", () => {
    render(<TrialExpirationModal {...mockProps} />);

    expect(
      screen.getByText("Controle completo de receitas e despesas")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Gestão de veículos e manutenções")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Relatórios detalhados e gráficos")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Compartilhamento com outros usuários")
    ).toBeInTheDocument();
  });
});
