import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import Transacoes from "./pages/Transacoes";
import Dividas from "./pages/Dividas";
import Categorias from "./pages/Categorias";
import Relatorios from "./pages/Relatorios";
import Metas from "./pages/Metas";
import Mercado from "./pages/Mercado";
import Veiculos from "./pages/Veiculos";
import Perfil from "./pages/Perfil";
import IA from "./pages/IA";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Dashboard />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receitas"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Receitas />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/despesas"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Despesas />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transacoes"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Transacoes />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dividas"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Dividas />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Categorias />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Relatorios />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/metas"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Metas />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mercado"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Mercado />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/veiculos"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Veiculos />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ia"
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <IA />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
