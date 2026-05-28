// app/(tabs)/index.tsx — HomeScreen (Versão Ultra-Minimalista)
// Lista de lembretes de contas unificada para o mês atual, ordenada por proximidade do vencimento

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { AccountCard } from '../../components/AccountCard';
import { PaymentStatus } from '../../types';
import {
  loadHomeItems,
  markItemAsPaid,
  removeAccount,
  HomeItem,
} from '../../store/useAccountStore';

export default function HomeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<HomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // O aplicativo agora foca no mês atual de forma fixa, simplificando a navegação
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-based

  const loadData = useCallback(async () => {
    try {
      const data = await loadHomeItems(currentYear, currentMonth);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentYear, currentMonth]);

  // Recarrega ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE'>('ALL');

  const overdueCount = items.filter(item => item.status === PaymentStatus.OVERDUE).length;

  // Filtrar itens de acordo com a aba ativa
  const filteredItems = items.filter(item => {
    if (activeTab === 'OVERDUE') {
      return item.status === PaymentStatus.OVERDUE;
    }
    return true;
  });

  const handlePay = async (item: HomeItem) => {
    try {
      await markItemAsPaid(item);
      await loadData();
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleEdit = (accountId: string) => {
    router.push({ pathname: '/edit', params: { id: accountId } });
  };

  const handleDelete = async (accountId: string) => {
    try {
      await removeAccount(accountId);
      await loadData();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Abas de Navegação */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}
          onPress={() => setActiveTab('ALL')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === 'ALL' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'OVERDUE' && styles.activeTab]}
          onPress={() => setActiveTab('OVERDUE')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={activeTab === 'OVERDUE' ? theme.colors.error : theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.tabText, activeTab === 'OVERDUE' && styles.activeTabTextError]}>
            Atrasadas
          </Text>
          {overdueCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{overdueCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de contas */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AccountCard
            item={item}
            onPay={handlePay}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={filteredItems.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          activeTab === 'OVERDUE' ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.success} />
              <Text style={styles.emptyTitle}>Nenhuma conta atrasada 🎉</Text>
              <Text style={styles.emptySubtitle}>
                Tudo sob controle e em dia por aqui!
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color={theme.colors.outline} />
              <Text style={styles.emptyTitle}>Nenhum lembrete cadastrado</Text>
              <Text style={styles.emptySubtitle}>
                Toque no botão + para adicionar um novo lembrete de conta
              </Text>
            </View>
          )
        }
      />

      {/* FAB — Botão flutuante + */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/add')}
      >
        <Ionicons name="add" size={28} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingTop: theme.spacing.xs,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primarySubtle,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    gap: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.onSurfaceVariant,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  activeTabTextError: {
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
});
