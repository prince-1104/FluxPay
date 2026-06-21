import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '@settl/utils';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/auth';

type Trip = {
  id: string;
  name: string;
  status: string;
  currency: string;
  expenseTotal?: number;
  memberCount?: number;
};

type Props = NativeStackScreenProps<any, 'Trips'>;

export default function TripsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiRequest<Trip[]>('/trips');
      setTrips(data);
    } catch {
      setTrips([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTrips(); }, [loadTrips]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Trips</Text>
        <TouchableOpacity onPress={logout}><Text style={styles.logout}>Logout</Text></TouchableOpacity>
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTrips} tintColor="#7C3AED" />}
        ListEmptyComponent={<Text style={styles.empty}>No trips yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TripDetail', { tripId: item.id, tripName: item.name })}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.memberCount ?? 0} members · {item.status}</Text>
            <Text style={styles.cardAmount}>{formatCurrency(item.expenseTotal ?? 0, item.currency)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#F8F8FF' },
  logout: { color: '#A78BFA' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#0F0F1A', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { color: '#F8F8FF', fontSize: 16, fontWeight: '600' },
  cardMeta: { color: '#888', fontSize: 13, marginTop: 4 },
  cardAmount: { color: '#10B981', fontSize: 15, fontWeight: '600', marginTop: 8 },
});
