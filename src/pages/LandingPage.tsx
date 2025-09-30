import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  DollarSign,
  TrendingUp,
  Users,
  Brain,
  CheckCircle,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Target,
  BarChart3,
  Wallet,
  PiggyBank,
  CreditCard,
  Smartphone,
  Clock,
  Award,
  PlayCircle,
  Quote,
  Car,
  ShoppingCart,
  FileText,
  Settings,
  ChartLine,
  FolderOpen,
  Bell,
  AlertTriangle,
  Moon,
} from "lucide-react";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Header/Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-orange-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center justify-center space-x-2">
              <div className="rounded-lg p-2 w-full max-w-sm">
                <img
                  src="/lovable-uploads/b9870db5-5510-4f26-a060-487dcd4bac35.png"
                  alt="Meu Dinheiro"
                  className="h-auto w-full max-h-20 sm:max-h-20 mx-auto object-contain"
                />
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#recursos"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Recursos
              </a>
              <a
                href="#preco"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Preço
              </a>
              <a
                href="#depoimentos"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Depoimentos
              </a>
            </div>
            <div className="flex space-x-4">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  Entrar
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={`space-y-8 transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border-orange-200 px-4 py-2">
                    <Zap className="h-4 w-4 mr-2" />
                    IA Revolucionária para Finanças
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" />7 Dias Grátis - Sem
                    Cartão
                  </Badge>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Transforme sua{" "}
                  <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    Vida Financeira
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  O único sistema que combina gestão financeira avançada com IA
                  para maximizar seus resultados. Controle total, insights
                  inteligentes e crescimento garantido.
                </p>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold text-lg">
                    🎉 Experimente GRÁTIS por 7 dias - Sem compromisso, sem
                    cartão de crédito!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Acesso completo a todas as funcionalidades premium
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xl text-lg px-8 py-4 w-full sm:w-auto group"
                  >
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 text-lg px-8 py-4 w-full sm:w-auto"
                  onClick={() =>
                    window.open("https://youtu.be/KTcGR6-sbkw", "_blank")
                  }
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Ver Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 border-2 border-white"
                      ></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    +5.000 usuários ativos
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-orange-400 text-orange-400"
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    4.9/5 (247 avaliações)
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-pink-200 rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">
                          Dashboard Financeiro
                        </h3>
                        <Badge className="bg-green-100 text-green-700">
                          +32% este mês
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-8 w-8 text-green-500" />
                              <div>
                                <p className="text-sm text-gray-600">
                                  Receitas
                                </p>
                                <p className="text-xl font-bold text-green-600">
                                  R$ 12.580
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <Wallet className="h-8 w-8 text-blue-500" />
                              <div>
                                <p className="text-sm text-gray-600">
                                  Economia
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                  R$ 3.247
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <Brain className="h-8 w-8 text-orange-500" />
                          <div>
                            <p className="font-medium text-gray-800">
                              IA Recomenda:
                            </p>
                            <p className="text-sm text-gray-600">
                              Invista R$ 500 em renda fixa para otimizar seus
                              ganhos
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "5.000+", label: "Usuários Ativos" },
              { number: "R$ 50M+", label: "Gerenciado" },
              { number: "98%", label: "Satisfação" },
              { number: "Premium", label: "Plataforma" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="recursos"
        className="py-20 bg-gradient-to-br from-gray-50 to-orange-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-orange-100 text-orange-700 px-4 py-2">
              Recursos Avançados
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                prosperar financeiramente
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistema completo de gestão financeira com recursos únicos para
              controlar suas finanças pessoais e empresariais de forma
              inteligente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Dashboard Interativo",
                description:
                  "Visão geral completa das suas finanças em tempo real com gráficos e métricas importantes.",
                color: "blue",
              },
              {
                icon: Wallet,
                title: "Receitas & Despesas",
                description:
                  "Controle completo de entradas e saídas com categorização inteligente e personalizada.",
                color: "green",
              },
              {
                icon: Target,
                title: "Metas Financeiras",
                description:
                  "Defina e monitore objetivos financeiros com acompanhamento detalhado do progresso.",
                color: "purple",
              },
              {
                icon: CreditCard,
                title: "Gestão de Dívidas",
                description:
                  "Acompanhe e controle todos os seus compromissos financeiros de forma organizada.",
                color: "red",
              },
              {
                icon: Users,
                title: "Compartilhamento",
                description:
                  "Tenha até 3 usuários enviando dados para a mesma conta, ideal para famílias e equipes.",
                color: "orange",
              },
              {
                icon: FileText,
                title: "Relatórios Detalhados",
                description:
                  "Análises profundas do comportamento financeiro com dashboard empresarial especializado.",
                color: "indigo",
              },
              {
                icon: Car,
                title: "Gestão de Veículos",
                description:
                  "Controle quilometragem, manutenções programadas e custos operacionais dos seus veículos.",
                color: "cyan",
              },
              {
                icon: ShoppingCart,
                title: "Lista de Mercado",
                description:
                  "Planeje suas compras e controle gastos com listas inteligentes e orçamentos.",
                color: "pink",
              },
              {
                icon: Brain,
                title: "Integração com IA",
                description:
                  "Assistente inteligente que oferece insights financeiros personalizados e recomendações.",
                color: "violet",
              },
              {
                icon: Bell,
                title: "Lembretes",
                description:
                  "Sistema de notificações inteligente para não perder prazos importantes e compromissos financeiros.",
                color: "yellow",
              },
              {
                icon: AlertTriangle,
                title: "Alerta de Dívida 1 dia antes",
                description:
                  "Receba notificações automáticas um dia antes do vencimento de suas dívidas e compromissos.",
                color: "amber",
              },
              {
                icon: Moon,
                title: "Modo Dark/Light",
                description:
                  "Interface adaptável com tema claro e escuro para melhor experiência visual em qualquer horário.",
                color: "slate",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-8">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon
                      className={`h-8 w-8 text-${feature.color}-600`}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-orange-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="preco" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-green-100 text-green-700 px-4 py-2">
              Preço Justo
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Invista no seu{" "}
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                futuro financeiro
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Um investimento pequeno que gera retornos enormes. Pague menos do
              que você gasta em um almoço por semana.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="relative overflow-hidden border-2 border-orange-200 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-pink-500"></div>

              <CardContent className="p-8 text-center">
                <div className="space-y-6">
                  <div>
                    <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 px-4 py-2 mb-4">
                      <Award className="h-4 w-4 mr-2" />
                      Mais Popular
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2">Plano Premium</h3>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-4xl font-bold">R$ 39,90</span>
                      <span className="text-gray-500">/mês</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Apenas R$ 1,33 por dia
                    </p>
                  </div>

                  <div className="space-y-4 text-left">
                    {[
                      "Lembretes",
                      "Dashboard Avançado",
                      "Gestão de Receitas e Despesas",
                      "Controle de Dívidas",
                      "Planejamento de Metas",
                      "Gestão de Veículos",
                      "Lista de Mercado Inteligente",
                      "Orçamentos Predefinidos",
                      "Controle de Usuários",
                      "Relatórios Detalhados",
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Link to="/login">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xl text-lg py-4 group"
                      >
                        Começar Agora
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>

                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4" />
                        <span>Cancele a qualquer momento</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Acesso imediato</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="depoimentos"
        className="py-20 bg-gradient-to-br from-orange-50 to-pink-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-blue-100 text-blue-700 px-4 py-2">
              Depoimentos
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              O que nossos{" "}
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                usuários dizem
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Silva",
                role: "Empresária",
                content:
                  "Em 3 meses consegui organizar completamente minhas finanças e aumentar minha reserva de emergência em 150%. A IA realmente funciona!",
                rating: 5,
                avatar: "MS",
              },
              {
                name: "João Santos",
                role: "Freelancer",
                content:
                  "Como freelancer, sempre tive dificuldade para controlar receitas variáveis. O sistema me ajudou a criar um planejamento perfeito.",
                rating: 5,
                avatar: "JS",
              },
              {
                name: "Ana Costa",
                role: "Família",
                content:
                  "Conseguimos economizar R$ 800 por mês só seguindo as recomendações da IA. Agora planejamos nossa casa própria!",
                rating: 5,
                avatar: "AC",
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              >
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-orange-400 text-orange-400"
                        />
                      ))}
                    </div>

                    <div className="relative">
                      <Quote className="absolute top-0 left-0 h-8 w-8 text-orange-200 -translate-x-2 -translate-y-2" />
                      <p className="text-gray-700 leading-relaxed italic">
                        "{testimonial.content}"
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Pronto para transformar sua vida financeira?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já descobriram o poder da IA
              para multiplicar seus resultados financeiros.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-4 w-full sm:w-auto group"
                >
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8 text-sm opacity-75">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Acesso imediato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg p-2">
                  <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    Meu Dinheiro
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Transformando vidas através da inteligência artificial
                financeira.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Recursos</div>
                <div>Preços</div>
                <div>Segurança</div>
                <div>API</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Central de Ajuda</div>
                <div>Contato</div>
                <div>Status</div>
                <div>Comunidade</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Sobre</div>
                <div>Blog</div>
                <div>Carreiras</div>
                <div>Privacidade</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Meu Dinheiro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
