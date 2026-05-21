import * as SQLite from 'expo-sqlite';
import type { Account, AccountPayment } from '../types';

const db = SQLite.openDatabaseSync('finlembrete_v2.db');

/**
 * Inicializa o banco de dados com o novo schema ultra-minimalista.
 * Sem amount, sem category, com due_day para recorrentes.
 */
export function initDB() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      due_day     INTEGER,          -- 1-31, para contas RECORRENTE
      due_date    TEXT,             -- ISO 8601, para contas AVULSO
      notes       TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account_payments (
      id                     TEXT PRIMARY KEY,
      account_id             TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      due_date               TEXT NOT NULL,
      status                 TEXT NOT NULL DEFAULT 'PENDING',
      paid_at                TEXT,
      notification_id_before TEXT,
      notification_id_day    TEXT
    );
  `);
}

initDB();

// ==================== ACCOUNTS ====================

export async function getAccounts(): Promise<Account[]> {
  const rows = db.getAllSync('SELECT * FROM accounts');
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    dueDay: r.due_day ?? undefined,
    dueDate: r.due_date ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getAccountById(id: string): Promise<Account | null> {
  const r: any = db.getFirstSync('SELECT * FROM accounts WHERE id=?', [id]);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    dueDay: r.due_day ?? undefined,
    dueDate: r.due_date ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function addAccount(account: Account): Promise<void> {
  const stmt = db.prepareSync(`
    INSERT INTO accounts (id, name, type, due_day, due_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.executeSync([
    account.id,
    account.name,
    account.type,
    account.dueDay ?? null,
    account.dueDate ?? null,
    account.notes ?? null,
    account.createdAt,
    account.updatedAt,
  ]);
  stmt.finalizeSync();
}

export async function updateAccount(updated: Account): Promise<void> {
  const stmt = db.prepareSync(`
    UPDATE accounts SET name=?, type=?, due_day=?, due_date=?, notes=?, updated_at=?
    WHERE id=?
  `);
  stmt.executeSync([
    updated.name,
    updated.type,
    updated.dueDay ?? null,
    updated.dueDate ?? null,
    updated.notes ?? null,
    updated.updatedAt,
    updated.id,
  ]);
  stmt.finalizeSync();
}

export async function deleteAccount(id: string): Promise<void> {
  const stmt = db.prepareSync('DELETE FROM accounts WHERE id=?');
  stmt.executeSync([id]);
  stmt.finalizeSync();
}

// ==================== ACCOUNT PAYMENTS ====================

export async function getPayments(): Promise<AccountPayment[]> {
  const rows = db.getAllSync('SELECT * FROM account_payments');
  return rows.map(mapPaymentRow);
}

export async function getPaymentsByAccountId(accountId: string): Promise<AccountPayment[]> {
  const rows = db.getAllSync(
    'SELECT * FROM account_payments WHERE account_id=?',
    [accountId],
  );
  return rows.map(mapPaymentRow);
}

export async function getPaymentForAccountMonth(
  accountId: string,
  yearMonth: string, // 'YYYY-MM'
): Promise<AccountPayment | null> {
  const payments = await getPaymentsByAccountId(accountId);
  return payments.find(p => p.dueDate.startsWith(yearMonth)) || null;
}

export async function addPayment(payment: AccountPayment): Promise<void> {
  const stmt = db.prepareSync(`
    INSERT INTO account_payments
      (id, account_id, due_date, status, paid_at, notification_id_before, notification_id_day)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.executeSync([
    payment.id,
    payment.accountId,
    payment.dueDate,
    payment.status,
    payment.paidAt ?? null,
    payment.notificationIdBefore ?? null,
    payment.notificationIdDay ?? null,
  ]);
  stmt.finalizeSync();
}

export async function updatePayment(updated: AccountPayment): Promise<void> {
  const stmt = db.prepareSync(`
    UPDATE account_payments
    SET status=?, paid_at=?, notification_id_before=?, notification_id_day=?
    WHERE id=?
  `);
  stmt.executeSync([
    updated.status,
    updated.paidAt ?? null,
    updated.notificationIdBefore ?? null,
    updated.notificationIdDay ?? null,
    updated.id,
  ]);
  stmt.finalizeSync();
}

// ==================== HELPERS ====================

function mapPaymentRow(r: any): AccountPayment {
  return {
    id: r.id,
    accountId: r.account_id,
    dueDate: r.due_date,
    status: r.status,
    paidAt: r.paid_at ?? undefined,
    notificationIdBefore: r.notification_id_before ?? undefined,
    notificationIdDay: r.notification_id_day ?? undefined,
  };
}
