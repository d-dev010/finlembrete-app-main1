// FinLembrete — Interfaces e Enums (versão ultra-minimalista)
// Sem valores monetários. Sem categorias. Foco apenas em LEMBRETES.

export enum AccountType {
  RECORRENTE = 'RECORRENTE', // Vence todo dia X do mês, para sempre
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID    = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface Account {
  id: string;
  name: string;              // Ex: "Netflix", "Aluguel", "Luz"
  type: AccountType;
  dueDay?: number;           // 1-31 — usado para RECORRENTE (dia fixo do mês)
  dueDate?: string;          // ISO 8601 "YYYY-MM-DD" — usado para retrocompatibilidade
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPayment {
  id: string;
  accountId: string;
  dueDate: string;           // Data real de vencimento deste período/mês
  status: PaymentStatus;
  paidAt?: string;
  notificationIdBefore?: string;
  notificationIdDay?: string;
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  [AccountType.RECORRENTE]: 'Recorrente',
};

