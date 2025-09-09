import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionSimple } from "@/hooks/useSubscriptionSimple";
import "./App.css";

function App() {
  console.log("🔧 App carregando...");

  try {
    const { user, loading: authLoading } = useAuth();
    console.log("✅ useAuth funcionando:", { user, authLoading });

    const { subscriptionData, loading: subLoading } = useSubscriptionSimple();
    console.log("✅ useSubscriptionSimple funcionando:", {
      subscriptionData,
      subLoading,
    });

    return (
      <Router>
        <div className="min-h-screen bg-background">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">🔧 App em Teste</h1>
            <p>
              Auth Status:{" "}
              {authLoading ? "Carregando..." : user ? "Logado" : "Não logado"}
            </p>
            <p>
              Subscription Status:{" "}
              {subLoading
                ? "Carregando..."
                : subscriptionData.effective_subscription
                ? "Ativo"
                : "Inativo"}
            </p>
          </div>
          <Toaster />
        </div>
      </Router>
    );
  } catch (error) {
    console.error("❌ Erro nos hooks:", error);
    return (
      <div className="p-8">
        <h1 className="text-red-600">Erro nos hooks</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}

export default App;
