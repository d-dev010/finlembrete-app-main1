// components/AccountCard.tsx — Seção 5.1 da documentação
// Card completo para exibição de conta na Home (Versão Ultra-Minimalista)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentStatus } from '../types';
import { theme } from '../theme';
import type { HomeItem } from '../store/useAccountStore';

type Props = {
  item: HomeItem;
  onPay: (item: HomeItem) => void;
  onEdit: (accountId: string) => void;
  onDelete: (accountId: string) => void;
};

export function AccountCard({ item, onPay, onEdit, onDelete }: Props) {
  const handleDelete = () => {
    Alert.alert(
      'Remover conta',
      `Tem certeza que deseja remover "${item.name}"?\nEsta ação não pode ser desfeita e removerá todos os lembretes dela.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => onDelete(item.accountId),
        },
      ],
    );
  };
  const dueDay = item.dueDate ? parseInt(item.dueDate.split('-')[2], 10) : null;

  return (
    <View style={styles.card}>
      {/* Header: Nome + Vencimento */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, item.status === PaymentStatus.PAID && styles.namePaid]} numberOfLines={1}>
            {item.name}
            {dueDay !== null && (
              <Text style={styles.dueDayText}> • Dia {dueDay}</Text>
            )}
          </Text>
        </View>
        {item.status === PaymentStatus.PAID && (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={styles.paidText}>Pago</Text>
          </View>
        )}
      </View>

      {/* Ações */}
      <View style={styles.actions}>
        {item.status !== PaymentStatus.PAID && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.payBtn]}
            onPress={() => onPay(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.onPrimary} />
            <Text style={styles.payText}>Confirmar Pagamento</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => onEdit(item.accountId)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={16} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.onSurface,
  },
  dueDayText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.onSurfaceVariant,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginRight: 6,
  },
  paidText: {
    fontSize: theme.fontSize.caption,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.success,
  },
  namePaid: {
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  payBtn: {
    backgroundColor: theme.colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  payText: {
    color: theme.colors.onPrimary,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.body,
  },
  editBtn: {
    backgroundColor: theme.colors.primarySubtle,
  },
  deleteBtn: {
    backgroundColor: theme.colors.errorLight,
  },
});
