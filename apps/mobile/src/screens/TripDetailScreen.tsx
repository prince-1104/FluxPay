import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '@settl/utils';
import { apiRequest } from '../lib/api';

type Expense = { id: string; title: string; totalAmount: number; category: string; paidBy: { name: string } };
type Balance = { name: string; net: number };

type Props = NativeStackScreenProps<any, 'TripDetail'>;

export default function TripDetailScreen({ route }: Props) {
  const { tripId, tripName } = route.params as { tripId: string; tripName: string };
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [expenseData, balanceData] = await Promise.all([
        apiRequest<Expense[]>(`/trips/${tripId}/expenses`),
        apiRequest<{ balances: Balance[] }>(`/trips/${tripId}/balances`),
      ]);
      setExpenses(expenseData);
      setBalances(balanceData.balances);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [tripId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#7C3AED" />}
    >
      <Text style={styles.section}>Balances</Text>
      {balances.map((b) => (
        <View key={b.name} style={styles.balanceRow}>
          <Text style={styles.balanceName}>{b.name}</Text>
          <Text style={[styles.balanceNet, { color: b.net >= 0 ? '#10B981' : '#EF4444' }]}>
            {b.net >= 0 ? '+' : ''}{formatCurrency(b.net)}
          </Text>
        </View>
      ))}

      <Text style={[styles.section, { marginTop: 24 }]}>Expenses — {tripName}</Text>
      {expenses.length === 0 ? (
        <Text style={styles.empty}>No expenses</Text>
      ) : expenses.map((item) => (
        <View key={item.id} style={styles.expenseRow}>
          <View>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseMeta}>{item.paidBy.name} · {item.category}</Text>
          </View>
          <Text style={styles.expenseAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810', padding: 16 },
  section: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  balanceName: { color: '#F8F8FF' },
  balanceNet: { fontWeight: '600' },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F0F1A', padding: 14, borderRadius: 10, marginBottom: 8 },
  expenseTitle: { color: '#F8F8FF', fontWeight: '500' },
  expenseMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  expenseAmount: { color: '#10B981', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 20 },
});
