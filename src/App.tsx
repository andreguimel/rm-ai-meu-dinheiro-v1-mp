import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import LazyRoute from "./components/LazyRoute";
import RouteWrapper from "./components/RouteWrapper";
import ErrorBoundary from "./components/ErrorBoundary";

// Páginas que não precisam de lazy loading (críticas)
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy loading das páginas principais
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Receitas = lazy(() => import("./pages/Receitas"));
const Despesas = lazy(() => import("./pages/Despesas"));
const Transacoes = lazy(() => import("./pages/Transacoes"));
const Dividas = lazy(() => import("./pages/Dividas"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Metas = lazy(() => import("./pages/Metas"));
const Mercado = lazy(() => import("./pages/Mercado"));
const Veiculos = lazy(() => import("./pages/Veiculos"));
const Lembretes = lazy(() => import("./pages/Lembretes"));
const Perfil = lazy(() => import("./pages/Perfil"));
const IA = lazy(() => import("./pages/IA"));

import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas com assinatura */}
            <Route path="/dashboard" element={<LazyRoute component={Dashboard} />} />
            <Route path="/receitas" element={<LazyRoute component={Receitas} />} />
            <Route path="/despesas" element={<LazyRoute component={Despesas} />} />
            <Route path="/transacoes" element={<LazyRoute component={Transacoes} />} />
            <Route path="/dividas" element={<LazyRoute component={Dividas} />} />
            <Route path="/categorias" element={<LazyRoute component={Categorias} />} />
            <Route path="/relatorios" element={<LazyRoute component={Relatorios} />} />
            <Route path="/metas" element={<LazyRoute component={Metas} />} />
            <Route path="/mercado" element={<LazyRoute component={Mercado} />} />
            <Route path="/veiculos" element={<LazyRoute component={Veiculos} />} />
            <Route path="/lembretes" element={<LazyRoute component={Lembretes} />} />
            <Route path="/ia" element={<LazyRoute component={IA} />} />
            
            {/* Rota protegida sem assinatura */}
            <Route 
              path="/perfil" 
              element={<LazyRoute component={Perfil} requiresSubscription={false} />} 
            />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
