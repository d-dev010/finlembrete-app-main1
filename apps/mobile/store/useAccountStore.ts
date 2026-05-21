// store/useAccountStore.ts — Lógica de negócio ultra-minimalista
// Sem valores monetários. Sem categorias. Só nomes, dias e status.

import { Account, AccountPayment, AccountType, PaymentStatus } from '../types';
import * as Storage from '../services/storage';
import {
  scheduleBillNotifications,
  cancelBillNotifications,
} from '../services/notifications';

// ─── ID único ────────────────────────────────────────────────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// ─── HomeItem — dados suficientes para exibir o card na Home ─────────────────
export type HomeItem = {
  id: string;           // id do AccountPayment
  accountId: string;
  name: string;
  type: AccountType;
  dueDate: string;      // "YYYY-MM-DD" do vencimento deste período
  status: PaymentStatus;
  paidAt?: string;
  notificationIdBefore?: string;
  notificationIdDay?: string;
};

// ─── Helpers de data ──────────────────────────────────────────────────────────

/**
 * Retorna "YYYY-MM-DD" para um determinado dia do mês e referência mês/ano.
 * Clipa o dia para o último dia do mês (ex: dia 31 em fevereiro → 28/29).
 */
export function dueDateForDayAndMonth(
  dueDay: number,
  year: number,
  month: number, // 1-based
): string {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Adiciona 1 mês a uma data "YYYY-MM-DD".
 */
function addOneMonth(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Passando month (1-based) diretamente: JS interpreta como mês seguinte (0-based + overflow)
  const date = new Date(year, month, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retorna "YYYY-MM" para um determinado mês 0-based e ano.
 */
function toYearMonth(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}`;
}

// ─── Carregar itens da Home ───────────────────────────────────────────────────

/**
 * Carrega todos os itens para a Home.
 *  - AVULSO: direto do AccountPayment.
 *  - RECORRENTE: gera dinamicamente o item do mês selecionado se não existir.
 *
 * @param selectedYear  Ano do filtro de mês
 * @param selectedMonth Mês 0-based do filtro (0=Janeiro … 11=Dezembro)
 */
export async function loadHomeItems(
  selectedYear: number,
  selectedMonth: number, // 0-based
): Promise<HomeItem[]> {
  const accounts = await Storage.getAccounts();
  const allPayments = await Storage.getPayments();
  const items: HomeItem[] = [];
  const yearMonth = toYearMonth(selectedYear, selectedMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const account of accounts) {
    // RECORRENTE: verifica se há payment para o mês/ano selecionado
    const payment = await Storage.getPaymentForAccountMonth(
      account.id,
      yearMonth,
    );

    if (payment) {
      const status = await resolveStatus(payment, today);
      items.push(makeItem(account, payment, status));
    } else {
      // Cria o item virtual para o mês selecionado (não salva ainda)
      const dueDate = dueDateForDayAndMonth(
        account.dueDay || 1,
        selectedYear,
        selectedMonth + 1,
      );
      const due = new Date(dueDate + 'T00:00:00');

      // Se o vencimento deste período for anterior à criação da conta, ignoramos o período virtual.
      const createdAtDate = new Date(account.createdAt);
      createdAtDate.setHours(0, 0, 0, 0);
      if (due < createdAtDate) {
        continue;
      }

      const status =
        due < today ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;

      // Se está atrasado e não existe payment, cria e salva o payment
      if (status === PaymentStatus.OVERDUE) {
        const newPayment = await ensurePaymentExists(account, dueDate);
        items.push(makeItem(account, newPayment, status));
      } else {
        // Virtual (não persistido até o usuário pagar)
        items.push({
          id: `virtual-${account.id}-${yearMonth}`,
          accountId: account.id,
          name: account.name,
          type: account.type,
          dueDate,
          status,
        });
      }
    }
  }

  return sortItems(items);
}

// ─── Criar conta ──────────────────────────────────────────────────────────────

export async function createAccount(data: {
  name: string;
  dueDay: number;
  notes?: string;
}): Promise<Account> {
  const now = new Date().toISOString();
  const account: Account = {
    id: generateId(),
    name: data.name,
    type: AccountType.RECORRENTE,
    dueDay: data.dueDay,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };
  await Storage.addAccount(account);

  // Cria o primeiro AccountPayment
  const dueDateStr = getFirstDueDate(data.dueDay);

  await ensurePaymentExists(account, dueDateStr);
  return account;
}

// ─── Editar conta ─────────────────────────────────────────────────────────────

export async function editAccount(
  accountId: string,
  data: Partial<Pick<Account, 'name' | 'dueDay' | 'dueDate' | 'notes'>>,
): Promise<void> {
  const account = await Storage.getAccountById(accountId);
  if (!account) throw new Error('Conta não encontrada');
  const updated: Account = {
    ...account,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await Storage.updateAccount(updated);
}

// ─── Marcar como pago ─────────────────────────────────────────────────────────

export async function markItemAsPaid(item: HomeItem): Promise<void> {
  const payments = await Storage.getPayments();
  const isVirtual = item.id.startsWith('virtual-');

  let payment: AccountPayment;

  if (isVirtual) {
    // Cria o payment agora que o usuário confirmou
    const account = await Storage.getAccountById(item.accountId);
    if (!account) throw new Error('Conta não encontrada');
    payment = await ensurePaymentExists(account, item.dueDate);
  } else {
    const found = payments.find(p => p.id === item.id);
    if (!found) throw new Error('Pagamento não encontrado');
    payment = found;
  }

  // Cancela notificações pendentes
  const toCancel = [
    payment.notificationIdBefore,
    payment.notificationIdDay,
  ].filter(Boolean) as string[];
  if (toCancel.length) await cancelBillNotifications(toCancel);

  // Marca como pago
  await Storage.updatePayment({
    ...payment,
    status: PaymentStatus.PAID,
    paidAt: new Date().toISOString(),
    notificationIdBefore: undefined,
    notificationIdDay: undefined,
  });

  // Se RECORRENTE → agenda notificação para o próximo mês
  const account = await Storage.getAccountById(item.accountId);
  if (account && account.type === AccountType.RECORRENTE) {
    const nextDueDate = addOneMonth(item.dueDate);
    await ensurePaymentExists(account, nextDueDate);
  }
}

// ─── Remover conta ────────────────────────────────────────────────────────────

export async function removeAccount(accountId: string): Promise<void> {
  const payments = await Storage.getPaymentsByAccountId(accountId);
  const ids: string[] = [];
  for (const p of payments) {
    if (p.notificationIdBefore) ids.push(p.notificationIdBefore);
    if (p.notificationIdDay) ids.push(p.notificationIdDay);
  }
  if (ids.length) await cancelBillNotifications(ids);
  await Storage.deleteAccount(accountId);
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

async function ensurePaymentExists(
  account: Account,
  dueDate: string,
): Promise<AccountPayment> {
  const payment: AccountPayment = {
    id: generateId(),
    accountId: account.id,
    dueDate,
    status: PaymentStatus.PENDING,
  };

  try {
    const notifIds = await scheduleBillNotifications(account.id, account.name, dueDate);
    payment.notificationIdBefore = notifIds.dayBeforeId;
    payment.notificationIdDay = notifIds.dayOfId;
  } catch {
    // Notificações podem falhar em emulador sem permissão
  }

  await Storage.addPayment(payment);
  return payment;
}

async function resolveStatus(
  payment: AccountPayment,
  today: Date,
): Promise<PaymentStatus> {
  if (payment.status === PaymentStatus.PAID) return PaymentStatus.PAID;
  const due = new Date(payment.dueDate + 'T00:00:00');
  if (due < today) {
    await Storage.updatePayment({ ...payment, status: PaymentStatus.OVERDUE });
    return PaymentStatus.OVERDUE;
  }
  return PaymentStatus.PENDING;
}

function makeItem(
  account: Account,
  payment: AccountPayment,
  status: PaymentStatus,
): HomeItem {
  return {
    id: payment.id,
    accountId: account.id,
    name: account.name,
    type: account.type,
    dueDate: payment.dueDate,
    status,
    paidAt: payment.paidAt,
    notificationIdBefore: payment.notificationIdBefore,
    notificationIdDay: payment.notificationIdDay,
  };
}

function sortItems(items: HomeItem[]): HomeItem[] {
  const order: Record<string, number> = {
    [PaymentStatus.OVERDUE]: 0,
    [PaymentStatus.PENDING]: 1,
    [PaymentStatus.PAID]: 2,
  };
  return [...items].sort((a, b) => {
    const diff = (order[a.status] ?? 1) - (order[b.status] ?? 1);
    if (diff !== 0) return diff;
    if (a.status === PaymentStatus.PAID) return b.dueDate.localeCompare(a.dueDate);
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/**
 * Retorna a data do primeiro vencimento para uma conta recorrente:
 * Se o dia do mês atual já passou, retorna o próximo mês.
 */
function getFirstDueDate(dueDay: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const thisMonthDate = dueDateForDayAndMonth(dueDay, year, month);
  if (new Date(thisMonthDate + 'T00:00:00') >= today) return thisMonthDate;
  // Próximo mês
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return dueDateForDayAndMonth(dueDay, nextYear, nextMonth);
}
