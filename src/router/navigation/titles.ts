import type { ActiveView } from "../../types/views";

export const viewTitles: Record<
  ActiveView,
  { title: string; subtitle: string }
> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral da loja" },
  products: { title: "Produtos", subtitle: "Catálogo da loja" },
  brands: { title: "Marcas", subtitle: "Marcas dos produtos da loja" },
  suppliers: {
    title: "Fornecedores",
    subtitle: "Cadastro de fornecedores da loja",
  },
  recipes: {
    title: "Receitas",
    subtitle: "Fichas técnicas dos produtos finais",
  },
  inventory: { title: "Estoque", subtitle: "Saldos e movimentações" },
  purchases: {
    title: "Compras",
    subtitle: "Calculadora de compras e entrada no estoque",
  },
  production: {
    title: "Produção",
    subtitle: "Ordens de produção e baixa de insumos",
  },
  sales: {
    title: "Vendas",
    subtitle: "Ordens de venda e baixa de estoque",
  },
  users: { title: "Usuários", subtitle: "Gestão de acesso ao sistema" },
  stores: { title: "Lojas", subtitle: "Suas lojas, dados e membros" },
  profile: { title: "Perfil", subtitle: "Seus dados de acesso" },
  settings: {
    title: "Configurações",
    subtitle: "Preferências e informações do sistema",
  },
  termsOfUse: {
    title: "Termos e Privacidade",
    subtitle: "Termos de Uso e Política de Privacidade",
  },
};
