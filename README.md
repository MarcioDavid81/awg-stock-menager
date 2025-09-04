# 🏭 AWG Stock Manager

Um sistema moderno e completo de gerenciamento de estoque de insumos agrícolas, desenvolvido com Next.js 15, TypeScript e Prisma. Projetado para fazendas que precisam de controle eficiente de insumos, fornecedores, entradas, saídas e aplicações.

## ✨ Funcionalidades

### 📊 Dashboard Inteligente
- **Estatísticas em tempo real** - Visualização de métricas importantes do estoque
- **Alertas de estoque baixo** - Notificações automáticas para produtos com baixo estoque
- **Movimentações recentes** - Histórico das últimas operações realizadas
- **Gráficos interativos** - Análise visual dos dados de estoque

### 📦 Gestão de Produtos
- **CRUD completo** - Criar, visualizar, editar e excluir produtos
- **Categorização** - Organização por categorias e subcategorias
- **Controle de estoque** - Monitoramento de quantidades mínimas e máximas
- **Busca avançada** - Filtros por nome, categoria e status
- **Paginação otimizada** - Navegação eficiente em grandes volumes de dados

### 🏢 Gerenciamento de Fornecedores
- **Cadastro flexível** - Suporte para Pessoa Física (CPF) e Jurídica (CNPJ)
- **Interface intuitiva** - Radio group para seleção do tipo de pessoa
- **Validação robusta** - Verificação automática de documentos
- **Informações completas** - Dados de contato, endereço e observações

### 🌾 Controle de Talhões
- **Mapeamento de áreas** - Cadastro de talhões com localização e área
- **Gestão territorial** - Organização por propriedades e regiões
- **Rastreabilidade** - Histórico de aplicações por talhão

### ⬆️ Entradas de Estoque
- **Tipos de entrada** - Compras e transferências positivas
- **Formulários dinâmicos** - Campos condicionais baseados no tipo de operação
- **Cálculo automático** - Valor total baseado em quantidade e valor unitário
- **Validação inteligente** - Schemas Zod para garantir integridade dos dados

### ⬇️ Saídas de Estoque
- **Tipos de saída** - Aplicações em talhões e transferências negativas
- **Controle por talhão** - Rastreamento de aplicações específicas
- **Observações detalhadas** - Registro de informações adicionais
- **Histórico completo** - Auditoria de todas as movimentações

### 📋 Controle de Estoque
- **Visão consolidada** - Status atual de todos os produtos
- **Alertas automáticos** - Notificações para estoque baixo
- **Relatórios detalhados** - Análises de movimentação e tendências

## 🏗️ Arquitetura Moderna

### Frontend
- **Next.js 15** - Framework React com App Router e Server Components
- **TypeScript** - Tipagem estática para maior segurança e produtividade
- **Tailwind CSS** - Framework CSS utilitário para design responsivo
- **ShadcnUI** - Componentes UI modernos e acessíveis
- **React Hook Form** - Gerenciamento eficiente de formulários
- **Zod** - Validação de schemas e tipagem runtime

### Backend
- **Next.js API Routes** - Endpoints RESTful integrados
- **Prisma ORM** - Mapeamento objeto-relacional type-safe
- **PostgreSQL** - Banco de dados relacional robusto e escalável

### Ferramentas de Desenvolvimento
- **ESLint** - Linting e padronização de código
- **PostCSS** - Processamento avançado de CSS
- **Lucide React** - Ícones SVG otimizados

## 🚀 Tecnologias Utilizadas

| Categoria | Tecnologia | Versão | Descrição |
|-----------|------------|--------|-----------|
| **Framework** | Next.js | 15.x | Framework React full-stack |
| **Linguagem** | TypeScript | 5.x | Superset tipado do JavaScript |
| **Banco de Dados** | Prisma + SQLite | 5.x | ORM moderno com banco embarcado |
| **UI/UX** | Tailwind CSS | 3.x | Framework CSS utilitário |
| **Componentes** | shadcn/ui | Latest | Biblioteca de componentes React |
| **Formulários** | React Hook Form | 7.x | Gerenciamento de formulários |
| **Validação** | Zod | 3.x | Schema validation library |
| **Ícones** | Lucide React | Latest | Ícones SVG otimizados |

## 📱 Características da Interface

### Design Responsivo
- **Mobile-first** - Interface otimizada para dispositivos móveis
- **Sidebar adaptável** - Menu lateral que se transforma em sheet no mobile
- **Componentes acessíveis** - Conformidade com padrões de acessibilidade

### Experiência do Usuário
- **Navegação intuitiva** - Menu lateral com indicadores visuais
- **Feedback visual** - Toasts e notificações para ações do usuário
- **Loading states** - Indicadores de carregamento em operações assíncronas
- **Validação em tempo real** - Feedback imediato em formulários

### Funcionalidades Avançadas
- **Busca e filtros** - Sistema de pesquisa em todas as listagens
- **Paginação** - Navegação eficiente em grandes datasets
- **Modais dinâmicos** - Dialogs para criação e edição de registros
- **Confirmações** - AlertDialogs para ações destrutivas

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Instalação

```bash
# Clone o repositório
git clone https://github.com/MarcioDavid81/awg-stock-menager
cd awg-stock-menager

# Instale as dependências
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### Configuração do Banco de Dados

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma db push

# (Opcional) Visualize o banco de dados
npx prisma studio
```

### Execução

```bash
# Inicie o servidor de desenvolvimento
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── api/               # Endpoints da API
│   ├── dashboard/         # Página do dashboard
│   ├── produtos/          # Gestão de produtos
│   ├── fornecedores/      # Gestão de fornecedores
│   ├── talhoes/           # Gestão de talhões
│   ├── entradas/          # Controle de entradas
│   ├── saidas/            # Controle de saídas
│   └── estoque/           # Visão do estoque
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base do shadcn/ui
│   └── layout/           # Componentes de layout
├── lib/                   # Utilitários e configurações
├── services/              # Serviços de API
├── types/                 # Definições de tipos TypeScript
└── hooks/                 # Custom hooks React
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linting do código

## 🚀 Deploy

O projeto está otimizado para deploy na [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), mas pode ser facilmente adaptado para outras plataformas.

Consulte a [documentação de deploy do Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**AWG Stock Manager** - Sistema de gestão de estoque moderno e eficiente para empresas que valorizam tecnologia e produtividade.
