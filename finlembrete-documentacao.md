# FinLembrete — Documentação do Produto

**Versão:** 1.0  
**Plataforma:** Android (API 26+, Android 8.0 Oreo)  
**Stack:** React Native + Expo  
**Armazenamento:** Local (AsyncStorage / SQLite via expo-sqlite)  
**Notificações:** expo-notifications  

---

## 1. Visão Geral

O FinLembrete é um aplicativo móvel pessoal de gerenciamento de contas a pagar. Sem back-end, sem conta, sem internet obrigatória — tudo roda 100% no dispositivo. O usuário cadastra contas fixas, parceladas ou avulsas e recebe notificações push um dia antes e no dia do vencimento.

---

## 2. Escopo do MVP

### Funcionalidades incluídas no MVP

| Módulo | Descrição |
|---|---|
| Cadastro de conta | Nome, valor, data de vencimento, categoria, tipo (avulso / recorrente / parcelado) |
| Parcelas | Número de parcelas, geração automática das datas subsequentes |
| Home | Lista de contas ordenada por proximidade do vencimento |
| Editar / Remover | Ações inline em cada item da lista |
| Marcar como pago | Controle de status por período |
| Notificações | Push local 1 dia antes + no dia do vencimento |
| Filtros básicos | Por status (pendente / pago / atrasado) e por mês |

### Funcionalidades fora do MVP (backlog)

- Exportar relatório em PDF
- Backup/restore via Google Drive
- Categorias personalizadas com ícone e cor
- Gráficos de gastos mensais
- Autenticação com biometria (pin/face/digital)
- Widget na tela inicial do Android
- Suporte a múltiplas moedas

---

## 3. Modelos de Dados

### 3.1 `Account` (Conta)

```typescript
interface Account {
  id: string;                     // UUID gerado localmente
  name: string;                   // Ex: "Netflix", "Aluguel", "Cartão Nubank"
  amount: number;                 // Valor em centavos (evita ponto flutuante)
  category: AccountCategory;      // Enum: MORADIA | ALIMENTACAO | TRANSPORTE | SAUDE | LAZER | OUTROS
  type: AccountType;              // Enum: AVULSO | RECORRENTE | PARCELADO
  dueDate: string;                // ISO 8601: "2025-07-10"
  notes?: string;                 // Observações livres (opcional)
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}
```

### 3.2 `Installment` (Parcela)

> Criadas automaticamente quando `type === 'PARCELADO'`.

```typescript
interface Installment {
  id: string;
  accountId: string;              // FK para Account
  index: number;                  // 1-based: 1, 2, 3, ...
  total: number;                  // Total de parcelas
  dueDate: string;                // ISO 8601 da parcela específica
  amount: number;                 // Valor desta parcela (pode diferir da última)
  status: PaymentStatus;          // Enum: PENDING | PAID | OVERDUE
  paidAt?: string;                // ISO 8601 quando marcado como pago
  notificationId?: string;        // ID do agendamento expo-notifications
}
```

### 3.3 `AccountPayment` (Pagamento de conta avulsa/recorrente)

```typescript
interface AccountPayment {
  id: string;
  accountId: string;
  dueDate: string;                // Data de referência do pagamento
  status: PaymentStatus;
  paidAt?: string;
  notificationId?: string;
}
```

### 3.4 Enums

```typescript
enum AccountType {
  AVULSO     = 'AVULSO',         // Única ocorrência
  RECORRENTE = 'RECORRENTE',     // Mensal sem fim definido
  PARCELADO  = 'PARCELADO',      // N parcelas com datas automáticas
}

enum AccountCategory {
  MORADIA    = 'MORADIA',
  ALIMENTACAO= 'ALIMENTACAO',
  TRANSPORTE = 'TRANSPORTE',
  SAUDE      = 'SAUDE',
  LAZER      = 'LAZER',
  OUTROS     = 'OUTROS',
}

enum PaymentStatus {
  PENDING  = 'PENDING',
  PAID     = 'PAID',
  OVERDUE  = 'OVERDUE',
}
```

---

## 4. Arquitetura e Stack

```
finlembrete/
├── src/
│   ├── components/          # Componentes reutilizáveis (AccountCard, Badge, etc.)
│   ├── screens/             # Telas (HomeScreen, AddAccountScreen, EditAccountScreen)
│   ├── navigation/          # React Navigation (Stack + Bottom Tab)
│   ├── store/               # Zustand: estado global
│   ├── services/
│   │   ├── storage.ts       # Abstração AsyncStorage / expo-sqlite
│   │   └── notifications.ts # Agendamento e cancelamento de notificações
│   ├── hooks/               # useAccounts, useNotifications
│   ├── utils/               # formatCurrency, formatDate, calcDueStatus
│   └── types/               # interfaces e enums acima
├── app.json
└── package.json
```

### Dependências principais

| Pacote | Versão | Uso |
|---|---|---|
| expo | ~51 | Runtime base |
| expo-notifications | ~0.28 | Notificações locais |
| expo-sqlite | ~14 | Banco local (SQLite) |
| @react-navigation/native | ^6 | Navegação |
| @react-navigation/stack | ^6 | Stack navigator |
| zustand | ^4 | State management |
| react-native-paper | ^5 | Componentes Material Design 3 |
| date-fns | ^3 | Manipulação de datas |
| react-hook-form | ^7 | Formulários com validação |

---

## 5. Telas e Fluxo de Navegação

```
App
└── Stack Navigator
    ├── HomeScreen          ← tela inicial
    ├── AddAccountScreen    ← formulário de criação
    ├── EditAccountScreen   ← formulário de edição (recebe accountId)
    └── AccountDetailScreen ← detalhes + histórico de parcelas (opcional MVP+)
```

### 5.1 HomeScreen

**Objetivo:** exibir todas as contas agrupadas por status e ordenadas por data de vencimento.

**Elementos de UI:**
- Header com saldo total a pagar no mês corrente
- Filtro horizontal por mês (chip pills: Jan, Fev, Mar...)
- Filtro de status: Todos | Pendentes | Pagos | Atrasados
- Lista de `AccountCard`s
- FAB (botão flutuante) `+` para adicionar conta

**AccountCard exibe:**
- Nome da conta
- Valor formatado (R$ 0.000,00)
- Data de vencimento + dias restantes ou "HOJE" ou "ATRASADO N dias"
- Badge de categoria com cor
- Badge de status (verde/amarelo/vermelho)
- Ações: ✓ Pagar | ✏️ Editar | 🗑️ Remover

**Lógica de ordenação:**
1. Atrasadas primeiro (por data desc)
2. Pendentes por data asc
3. Pagas por data desc

### 5.2 AddAccountScreen / EditAccountScreen

**Campos do formulário:**

| Campo | Tipo | Validação |
|---|---|---|
| Nome | TextInput | Obrigatório, máx 60 chars |
| Valor (R$) | TextInput numérico | Obrigatório, > 0 |
| Data de vencimento | DatePicker | Obrigatório |
| Categoria | Select (Picker) | Obrigatório |
| Tipo | SegmentedControl | Obrigatório |
| Nº de parcelas | TextInput numérico | Visível apenas se tipo = PARCELADO, min 2, máx 360 |
| Observações | TextInput multilinha | Opcional |

**Comportamento ao salvar:**
- Se `PARCELADO`: gera N registros de `Installment` com datas mensais subsequentes e agenda N×2 notificações
- Se `RECORRENTE`: cria a conta base e agenda a notificação do próximo vencimento; ao marcar como pago, avança para o próximo mês e reagenda
- Se `AVULSO`: cria 1 `AccountPayment` e agenda 2 notificações

---

## 6. Sistema de Notificações

### 6.1 Permissões

Solicitar permissão na primeira abertura do app via `Notifications.requestPermissionsAsync()`. Se negado, exibir banner na Home com instrução para habilitar nas configurações.

### 6.2 Gatilhos de agendamento

Cada conta/parcela agenda **2 notificações locais**:

| Quando | Conteúdo |
|---|---|
| 1 dia antes às 09:00 | "📅 [Nome] vence amanhã — R$ X,XX" |
| No dia do vencimento às 09:00 | "🔔 [Nome] vence hoje — R$ X,XX" |

### 6.3 Ciclo de vida das notificações

```
Criar conta        → agendar 2 notificações → salvar notificationId em storage
Editar data        → cancelar notificações antigas → agendar novas
Marcar como pago   → cancelar notificações → (se recorrente: agendar próximo mês)
Remover conta      → cancelar todas as notificações vinculadas
```

### 6.4 Implementação (expo-notifications)

```typescript
// services/notifications.ts

import * as Notifications from 'expo-notifications';
import { subDays, set } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function scheduleAccountNotifications(
  accountId: string,
  name: string,
  amount: number,
  dueDate: Date,
): Promise<{ dayBefore: string; dayOf: string }> {
  const morning = { hour: 9, minute: 0, second: 0 };

  const dayBefore = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Conta vence amanhã',
      body: `${name} — ${formatCurrency(amount)}`,
      data: { accountId },
    },
    trigger: set(subDays(dueDate, 1), morning),
  });

  const dayOf = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Conta vence hoje',
      body: `${name} — ${formatCurrency(amount)}`,
      data: { accountId },
    },
    trigger: set(dueDate, morning),
  });

  return { dayBefore, dayOf };
}

export async function cancelAccountNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}
```

---

## 7. Armazenamento Local

### Opção recomendada: expo-sqlite

Mais robusto que AsyncStorage para queries complexas (filtrar por mês, ordenar, etc.).

**Schema SQL:**

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  category    TEXT NOT NULL,
  type        TEXT NOT NULL,
  due_date    TEXT NOT NULL,
  notes       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS installments (
  id              TEXT PRIMARY KEY,
  account_id      TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  idx             INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  due_date        TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  paid_at         TEXT,
  notification_id_before TEXT,
  notification_id_day    TEXT
);

CREATE TABLE IF NOT EXISTS account_payments (
  id              TEXT PRIMARY KEY,
  account_id      TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  due_date        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  paid_at         TEXT,
  notification_id_before TEXT,
  notification_id_day    TEXT
);
```

---

## 8. UI / Design System

**Paleta de cores base (Material Design 3 / react-native-paper) — Mint Green Pastel:**

| Token | Hex | Uso |
|---|---|---|
| Primary | `#4DB896` | Botões, FAB, foco, destaques principais |
| Primary Light | `#A8DFC9` | Backgrounds de header, chips selecionados |
| Primary Subtle | `#E8F7F2` | Background de cards, telas de listagem |
| Secondary | `#7EC8A8` | Elementos secundários, ícones de categoria |
| Surface | `#FFFFFF` | Cards, modais, formulários |
| Background | `#F4FBF8` | Fundo geral do app |
| On Primary | `#FFFFFF` | Texto sobre botões primários |
| On Surface | `#1A2E26` | Texto principal (verde-escuro quase preto) |
| On Surface Variant | `#4A7264` | Texto secundário, placeholders |
| Success | `#3DAA80` | Status PAGO — variante escura do primary |
| Warning | `#F5A623` | Status PENDENTE próximo — âmbar suave |
| Error | `#E57373` | Status ATRASADO — vermelho pastel |
| Error Light | `#FDEAEA` | Background de badge de atraso |
| Outline | `#C5E4D8` | Bordas de cards, divisores |

**Tokens de elevação (sem sombras pesadas — estilo flat pastel):**

| Nível | Estilo |
|---|---|
| Surface 0 | `#FFFFFF` — modais, formulários |
| Surface 1 | `#F4FBF8` — fundo do app |
| Surface 2 | `#E8F7F2` — cards em repouso |
| Surface 3 | `#A8DFC9` — header, FAB container |

**Configuração no react-native-paper:**

```typescript
// theme.ts
import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          '#4DB896',
    primaryContainer: '#A8DFC9',
    secondary:        '#7EC8A8',
    secondaryContainer: '#E8F7F2',
    surface:          '#FFFFFF',
    surfaceVariant:   '#E8F7F2',
    background:       '#F4FBF8',
    onPrimary:        '#FFFFFF',
    onSurface:        '#1A2E26',
    onSurfaceVariant: '#4A7264',
    outline:          '#C5E4D8',
    error:            '#E57373',
    errorContainer:   '#FDEAEA',
  },
};
```

**Tipografia:**
- Títulos: Roboto Medium 18–22sp, cor `#1A2E26`
- Corpo: Roboto Regular 14–16sp, cor `#1A2E26`
- Caption/Badge: Roboto Medium 11–12sp, cor `#4A7264`
- Valores monetários: Roboto Medium 20sp, cor `#4DB896`

**Componentes-chave:**

- `AccountCard` — fundo `#FFFFFF`, borda `1px #C5E4D8`, border-radius 16dp, sem sombra
- `StatusBadge` — pill: PAGO `#E8F7F2`+`#3DAA80`, PENDENTE `#FFF8EC`+`#F5A623`, ATRASADO `#FDEAEA`+`#E57373`
- `CategoryBadge` — pill com fundo `#E8F7F2`, texto `#4A7264`, emoji à esquerda
- `DueDateChip` — fundo `#A8DFC9` (próximo), `#FFF8EC` (hoje), `#FDEAEA` (atrasado)
- `AmountText` — cor `#4DB896` para valores positivos
- `FAB` — fundo `#4DB896`, ícone branco, border-radius 16dp (estilo extended FAB)

---

## 9. Lógica de Negócio

### 9.1 Cálculo de status

```typescript
// utils/calcDueStatus.ts
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export type DueStatus = 'PAID' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'FUTURE';

export function calcDueStatus(dueDate: string, status: PaymentStatus): DueStatus {
  if (status === 'PAID') return 'PAID';
  const today = startOfDay(new Date());
  const due   = startOfDay(parseISO(dueDate));
  const diff  = differenceInDays(due, today);
  if (diff < 0)  return 'OVERDUE';
  if (diff === 0) return 'TODAY';
  if (diff <= 3)  return 'UPCOMING';
  return 'FUTURE';
}
```

### 9.2 Geração de parcelas

```typescript
// utils/generateInstallments.ts
import { addMonths, format } from 'date-fns';

export function generateInstallments(
  accountId: string,
  firstDueDate: Date,
  totalAmount: number,
  count: number,
): Omit<Installment, 'id' | 'status' | 'paidAt' | 'notificationId'>[] {
  const perInstallment = Math.floor(totalAmount / count);
  const remainder = totalAmount % count; // centavos restantes vão para a última parcela

  return Array.from({ length: count }, (_, i) => ({
    accountId,
    index: i + 1,
    total: count,
    dueDate: format(addMonths(firstDueDate, i), 'yyyy-MM-dd'),
    amount: i === count - 1 ? perInstallment + remainder : perInstallment,
  }));
}
```

### 9.3 Recorrência mensal

Ao marcar uma conta `RECORRENTE` como paga:
1. Atualiza o `AccountPayment` atual para `PAID`
2. Cria um novo `AccountPayment` com `dueDate = addMonths(atual, 1)`
3. Cancela notificações antigas e agenda novas para a nova data

---

## 10. O Que Adicionar ao App (Recomendações)

Itens abaixo **não estão no MVP** mas têm alto impacto e baixo custo de implementação:

### Alta prioridade (adicione antes de publicar)

| # | Feature | Motivo |
|---|---|---|
| 1 | **Onboarding de 3 telas** | Explica notificações e pede permissão no contexto certo, aumenta taxa de concessão |
| 2 | **Resumo mensal no topo da Home** | "R$ 1.200 a pagar este mês | R$ 480 pago" — feedback imediato de situação financeira |
| 3 | **Confirmação antes de remover** | Bottom sheet de confirmação para evitar deleção acidental |
| 4 | **Swipe-to-pay na lista** | Deslizar o card para a direita marca como pago — UX rápida para uso diário |
| 5 | **Badge de notificações no ícone do app** | Conta quantas contas vencem hoje ou estão atrasadas |

### Média prioridade (próximas versões)

| # | Feature | Motivo |
|---|---|---|
| 6 | **Filtro/busca por nome** | Quando a lista crescer fica indispensável |
| 7 | **Histórico de pagamentos por conta** | Ver quando cada parcela foi paga |
| 8 | **Dark mode** | O react-native-paper suporta nativamente; custo baixo |
| 9 | **Backup via arquivo JSON** | Exporta/importa dados sem back-end, via compartilhamento nativo |
| 10 | **Gráfico de barras mensal** | Quanto gastou por mês — usa `react-native-gifted-charts` |

### Baixa prioridade (backlog futuro)

- Widget na home screen (via expo-widgets — ainda experimental)
- Integração com Google Calendar para exportar datas
- Autenticação biométrica (expo-local-authentication)
- Suporte a múltiplas contas bancárias por pagamento

---

## 11. Checklist de Configuração do Projeto

```bash
# 1. Criar projeto Expo
npx create-expo-app@latest finlembrete --template blank-typescript

# 2. Instalar dependências
npx expo install expo-notifications expo-sqlite expo-device
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-paper react-native-vector-icons
npm install zustand date-fns react-hook-form
npm install react-native-gesture-handler react-native-reanimated

# 3. Configurar app.json para notificações (Android)
# Adicionar em "plugins":
# ["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#4DB896" }]
```

**Permissões necessárias em `app.json`:**
```json
{
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "SCHEDULE_EXACT_ALARM"
    ]
  }
}
```

> **Nota:** A partir do Android 12 (API 31), a permissão `SCHEDULE_EXACT_ALARM` deve ser solicitada explicitamente ou o app precisa usar `setExactAndAllowWhileIdle`. O expo-notifications lida com isso internamente no SDK 50+.

---

## 12. Roadmap de Entregas

| Sprint | Duração | Entregáveis |
|---|---|---|
| Sprint 1 | 1 semana | Projeto base + modelos de dados + schema SQLite + CRUD de contas |
| Sprint 2 | 1 semana | HomeScreen + filtros + AccountCard + DueDateChip |
| Sprint 3 | 1 semana | Formulário de adicionar/editar + validação + geração de parcelas |
| Sprint 4 | 1 semana | Serviço de notificações + testes em dispositivo físico |
| Sprint 5 | 3 dias | Polimento de UI + dark mode + onboarding |
| Sprint 6 | 2 dias | Build de produção (EAS Build) + publicação interna |

---

*Documentação gerada para o projeto FinLembrete — versão MVP 1.0*
