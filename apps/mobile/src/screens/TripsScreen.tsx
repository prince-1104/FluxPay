import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '@settl/utils';
import { apiRequest, ApiError } from '../lib/api';
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

type Props = NativeStackScreenProps<any, 'TripsList'>;

export default function TripsScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  async function handleCreate() {
    if (!tripName.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest('/trips', {
        method: 'POST',
        body: JSON.stringify({ name: tripName.trim(), currency: 'INR' }),
      });
      setCreateOpen(false);
      setTripName('');
      loadTrips();
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest('/trips/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      setJoinOpen(false);
      setInviteCode('');
      loadTrips();
      Alert.alert('Success', 'Joined trip!');
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={shared.screen}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
        <TouchableOpacity style={[shared.button, { flex: 1 }]} onPress={() => setCreateOpen(true)}>
          <Text style={shared.buttonText}>+ New trip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[shared.buttonOutline, { flex: 1 }]} onPress={() => setJoinOpen(true)}>
          <Text style={shared.buttonOutlineText}>Join code</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTrips} tintColor={colors.brand} />}
        ListEmptyComponent={<Text style={shared.empty}>No trips yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={shared.card}
            onPress={() => navigation.navigate('TripDetail', { tripId: item.id, tripName: item.name })}
          >
            <Text style={shared.cardTitle}>{item.name}</Text>
            <Text style={shared.cardMeta}>
              {item.memberCount ?? 0} members · {item.status}
            </Text>
            <Text style={{ color: colors.emerald, fontSize: 15, fontWeight: '600', marginTop: 8 }}>
              {formatCurrency(item.expenseTotal ?? 0, item.currency)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={createOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Create trip</Text>
            <TextInput
              style={shared.input}
              placeholder="Trip name"
              placeholderTextColor={colors.textMuted}
              value={tripName}
              onChangeText={setTripName}
            />
            <TouchableOpacity style={shared.button} onPress={handleCreate} disabled={submitting}>
              <Text style={shared.buttonText}>{submitting ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setCreateOpen(false)}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={joinOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Join with invite code</Text>
            <TextInput
              style={shared.input}
              placeholder="Invite code"
              placeholderTextColor={colors.textMuted}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <TouchableOpacity style={shared.button} onPress={handleJoin} disabled={submitting}>
              <Text style={shared.buttonText}>{submitting ? 'Joining…' : 'Join trip'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setJoinOpen(false)}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
