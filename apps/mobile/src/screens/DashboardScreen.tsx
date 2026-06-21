import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '@settl/utils';
import { apiRequest } from '../lib/api';
import { shared } from '../theme/styles';
import { colors } from '../theme/colors';

type Trip = {
  id: string;
  name: string;
  status: string;
  currency: string;
  expenseTotal?: number;
  memberCount?: number;
};

export default function DashboardScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalSpent = trips.reduce((s, t) => s + (t.expenseTotal ?? 0), 0);
  const totalMembers = trips.reduce((s, t) => s + (t.memberCount ?? 0), 0);
  const activeTrips = trips.filter((t) => t.status === 'ACTIVE').length;

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.brand} />}
    >
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 16 }}>
        Dashboard
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Trips', value: String(trips.length) },
          { label: 'Active', value: String(activeTrips) },
          { label: 'Members', value: String(totalMembers) },
          { label: 'Total spent', value: formatCurrency(totalSpent) },
        ].map((stat) => (
          <View key={stat.label} style={[shared.card, { flex: 1, minWidth: '45%' }]}>
            <Text style={shared.cardMeta}>{stat.label}</Text>
            <Text style={[shared.cardTitle, { fontSize: 20, marginTop: 4 }]}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <Text style={shared.sectionTitle}>Recent trips</Text>
      {trips.length === 0 ? (
        <Text style={shared.empty}>No trips yet. Open Trips tab to create one.</Text>
      ) : (
        trips.slice(0, 5).map((trip) => (
          <View key={trip.id} style={shared.card}>
            <Text style={shared.cardTitle}>{trip.name}</Text>
            <Text style={shared.cardMeta}>
              {trip.memberCount ?? 0} members · {trip.status}
            </Text>
            <Text style={{ color: colors.emerald, fontWeight: '600', marginTop: 8 }}>
              {formatCurrency(trip.expenseTotal ?? 0, trip.currency)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
