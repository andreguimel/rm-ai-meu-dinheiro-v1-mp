// Data constants for the application
export const DATA_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Limits
  MAX_CATEGORIES: 50,
  MAX_VEHICLES: 10,
  MAX_GOALS: 20,
  MAX_MARKET_ITEMS: 1000,

  // File uploads
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],

  // Dates
  MIN_DATE: "1900-01-01",
  MAX_DATE: "2099-12-31",

  // Currency
  DEFAULT_CURRENCY: "BRL",
  CURRENCY_SYMBOL: "R$",

  // Trial settings
  TRIAL_DAYS: 7,

  // Subscription
  SUBSCRIPTION_TYPES: ["monthly", "yearly"] as const,

  // Status types
  TRANSACTION_STATUS: ["pending", "completed", "cancelled"] as const,
  SUBSCRIPTION_STATUS: ["active", "cancelled", "past_due", "trialing"] as const,
  PAYMENT_STATUS: ["pending", "approved", "rejected", "cancelled"] as const,
} as const;

// Category types and defaults
export const CATEGORY_TYPES = {
  RECEITA: "receita",
  DESPESA: "despesa",
  MERCADO: "mercado",
  META: "meta",
} as const;

export const DEFAULT_CATEGORIES = {
  RECEITAS: [
    { nome: "Salário", cor: "#10B981", icone: "💰" },
    { nome: "Freelance", cor: "#3B82F6", icone: "💻" },
    { nome: "Investimentos", cor: "#8B5CF6", icone: "📈" },
    { nome: "Outros", cor: "#6B7280", icone: "💼" },
  ],
  DESPESAS: [
    { nome: "Alimentação", cor: "#EF4444", icone: "🍽️" },
    { nome: "Transporte", cor: "#F59E0B", icone: "🚗" },
    { nome: "Moradia", cor: "#8B5CF6", icone: "🏠" },
    { nome: "Saúde", cor: "#EC4899", icone: "🏥" },
    { nome: "Educação", cor: "#3B82F6", icone: "📚" },
    { nome: "Lazer", cor: "#10B981", icone: "🎮" },
    { nome: "Outros", cor: "#6B7280", icone: "💸" },
  ],
  MERCADO: [
    { nome: "Frutas e Verduras", cor: "#10B981", icone: "🥬" },
    { nome: "Carnes", cor: "#EF4444", icone: "🥩" },
    { nome: "Laticínios", cor: "#F59E0B", icone: "🥛" },
    { nome: "Padaria", cor: "#8B5CF6", icone: "🍞" },
    { nome: "Bebidas", cor: "#3B82F6", icone: "🥤" },
    { nome: "Limpeza", cor: "#EC4899", icone: "🧽" },
    { nome: "Higiene", cor: "#06B6D4", icone: "🧴" },
    { nome: "Outros", cor: "#6B7280", icone: "🛒" },
  ],
  METAS: [
    { nome: "Viagem", cor: "#3B82F6", icone: "✈️" },
    { nome: "Casa Própria", cor: "#10B981", icone: "🏠" },
    { nome: "Carro", cor: "#F59E0B", icone: "🚗" },
    { nome: "Educação", cor: "#8B5CF6", icone: "🎓" },
    { nome: "Reserva de Emergência", cor: "#EF4444", icone: "🛡️" },
    { nome: "Aposentadoria", cor: "#6B7280", icone: "👴" },
    { nome: "Outros", cor: "#EC4899", icone: "🎯" },
  ],
} as const;

// Vehicle types and brands
export const VEHICLE_TYPES = [
  "Carro",
  "Moto",
  "Caminhão",
  "Van",
  "SUV",
  "Pickup",
  "Ônibus",
  "Outros",
] as const;

export const VEHICLE_BRANDS = [
  "Volkswagen",
  "Chevrolet",
  "Ford",
  "Fiat",
  "Toyota",
  "Honda",
  "Hyundai",
  "Nissan",
  "Renault",
  "Peugeot",
  "Citroën",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Mitsubishi",
  "Jeep",
  "Kia",
  "Suzuki",
  "Subaru",
  "Outros",
] as const;

// Maintenance types
export const DEFAULT_MAINTENANCE_TYPES = [
  {
    nome: "Troca de Óleo",
    descricao: "Troca de óleo do motor",
    intervalo_km: 10000,
  },
  {
    nome: "Filtro de Ar",
    descricao: "Troca do filtro de ar",
    intervalo_km: 15000,
  },
  {
    nome: "Filtro de Combustível",
    descricao: "Troca do filtro de combustível",
    intervalo_km: 20000,
  },
  {
    nome: "Pastilhas de Freio",
    descricao: "Troca das pastilhas de freio",
    intervalo_km: 30000,
  },
  {
    nome: "Pneus",
    descricao: "Troca ou rodízio de pneus",
    intervalo_km: 40000,
  },
  {
    nome: "Correia Dentada",
    descricao: "Troca da correia dentada",
    intervalo_km: 60000,
  },
  {
    nome: "Revisão Geral",
    descricao: "Revisão completa do veículo",
    intervalo_km: 20000,
  },
] as const;

// Colors for charts and UI
export const CHART_COLORS = [
  "#10B981", // green
  "#3B82F6", // blue
  "#F59E0B", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#F43F5E", // rose
] as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "dd/MM/yyyy HH:mm",
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Number formats
export const NUMBER_FORMATS = {
  CURRENCY: {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  PERCENTAGE: {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  },
  DECIMAL: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: "theme",
  USER_PREFERENCES: "user_preferences",
  ONBOARDING_COMPLETED: "onboarding_completed",
  LAST_BACKUP: "last_backup",
} as const;

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  SUBSCRIPTION: {
    STATUS: "/subscription/status",
    CREATE_CHECKOUT: "/subscription/create-checkout",
    CANCEL: "/subscription/cancel",
  },
  MERCADOPAGO: {
    WEBHOOKS: "/mercadopago-webhooks",
    CHECK_SUBSCRIPTION: "/check-mercadopago-subscription",
  },
} as const;
