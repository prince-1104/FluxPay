import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { formatCurrency, resolveSplits } from '@settl/utils';
import type { TripWithMembers, UserSearchResult } from '@settl/types';
import { useAuth } from '../context/auth';
import { apiRequest, ApiError } from '../lib/api';
import { shared } from '../theme/styles';
import { colors } from '../theme/colors';

type Expense = {
  id: string;
  title: string;
  totalAmount: number;
  category: string;
  paidBy: { id: string; name: string };
};

type Balance = { userId: string; name: string; net: number };
type Settlement = {
  id: string;
  payerId: string;
  payeeId: string;
  amount: number;
  status: string;
  payer: { name: string };
  payee: { name: string };
};

type Tab = 'expenses' | 'balances' | 'settlements' | 'members';
type Props = NativeStackScreenProps<any, 'TripDetail'>;

function memberName(m: TripWithMembers['members'][number]) {
  return m.displayName ?? m.user?.name ?? 'Member';
}

function canRemoveMember(
  member: TripWithMembers['members'][number],
  actorRole?: TripWithMembers['members'][number]['role']
) {
  if (!actorRole || !['OWNER', 'ADMIN'].includes(actorRole)) return false;
  if (member.role === 'OWNER') return false;
  if (member.role === 'ADMIN') return actorRole === 'OWNER';
  return true;
}

export default function TripDetailScreen({ route }: Props) {
  const { tripId } = route.params as { tripId: string; tripName?: string };
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('expenses');
  const [trip, setTrip] = useState<TripWithMembers | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [paidByUserId, setPaidByUserId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [friends, setFriends] = useState<Array<{ id: string; user: { id: string; name: string; username: string } }>>([]);
  const [settlePayer, setSettlePayer] = useState('');
  const [settlePayee, setSettlePayee] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [tripData, expenseData, balanceData, settlementData] = await Promise.all([
        apiRequest<TripWithMembers>(`/trips/${tripId}`),
        apiRequest<Expense[]>(`/trips/${tripId}/expenses`),
        apiRequest<{ balances: Balance[] }>(`/trips/${tripId}/balances`),
        apiRequest<Settlement[]>(`/trips/${tripId}/settlements`),
      ]);
      setTrip(tripData);
      setExpenses(expenseData);
      setBalances(balanceData.balances);
      setSettlements(settlementData);
      setPaidByUserId(user?.id ?? tripData.members[0]?.userId ?? '');
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [tripId, user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const currentRole = trip?.members.find((m) => m.userId === user?.id)?.role;
  const isAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const memberMap = Object.fromEntries((trip?.members ?? []).map((m) => [m.userId, memberName(m)]));

  async function copyInvite() {
    if (!trip?.inviteCode) return;
    await Clipboard.setStringAsync(trip.inviteCode);
    Alert.alert('Copied', 'Invite code copied');
  }

  async function handleAddExpense() {
    const amount = parseFloat(expAmount);
    if (!expTitle.trim() || amount <= 0 || !trip) return;
    setSubmitting(true);
    try {
      const splits = trip.members.map((m) => ({ userId: m.userId, splitType: 'EQUAL' as const }));
      resolveSplits(amount, splits);
      await apiRequest(`/trips/${tripId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          title: expTitle.trim(),
          totalAmount: amount,
          category: 'OTHER',
          paidByUserId: paidByUserId || user?.id,
          splits,
        }),
      });
      setExpenseOpen(false);
      setExpTitle('');
      setExpAmount('');
      load();
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function openAddMember() {
    setMemberOpen(true);
    setMemberSearch('');
    setSearchResults([]);
    try {
      const data = await apiRequest<typeof friends>('/friends');
      setFriends(data);
    } catch {
      setFriends([]);
    }
  }

  async function searchUsers(text: string) {
    setMemberSearch(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiRequest<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(text.trim())}`);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }

  async function addMemberToTrip(userId: string) {
    setSubmitting(true);
    try {
      await apiRequest(`/trips/${tripId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setMemberOpen(false);
      load();
      Alert.alert('Success', 'Member added');
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmRemoveMember(m: TripWithMembers['members'][number]) {
    Alert.alert(
      'Remove member?',
      `Remove ${memberName(m)} (@${m.user?.username}) from this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/trips/${tripId}/members/${m.userId}`, { method: 'DELETE' });
              load();
            } catch (e) {
              Alert.alert('Error', (e as ApiError).message);
            }
          },
        },
      ]
    );
  }

  async function handleSettle() {
    const amount = parseFloat(settleAmount);
    if (!settlePayer || !settlePayee || amount <= 0) return;
    setSubmitting(true);
    try {
      const settlement = await apiRequest<{ id: string }>(`/trips/${tripId}/settlements`, {
        method: 'POST',
        body: JSON.stringify({ payerId: settlePayer, payeeId: settlePayee, amount, method: 'UPI' }),
      });
      await apiRequest(`/trips/${tripId}/settlements/${settlement.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED', method: 'UPI' }),
      });
      setSettleOpen(false);
      setSettleAmount('');
      load();
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteExpense(expenseId: string) {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' });
            load();
          } catch (e) {
            Alert.alert('Error', (e as ApiError).message);
          }
        },
      },
    ]);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'expenses', label: `Expenses (${expenses.length})` },
    { key: 'balances', label: 'Balances' },
    { key: 'settlements', label: `Settle (${settlements.length})` },
    { key: 'members', label: `Members (${trip?.memberCount ?? 0})` },
  ];

  const memberIds = new Set(trip?.members.map((m) => m.userId) ?? []);
  const availableFriends = friends.filter((f) => !memberIds.has(f.user.id));

  return (
    <View style={shared.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.brand} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {trip && (
          <View style={shared.card}>
            <View style={shared.row}>
              <Text style={[shared.cardTitle, { fontSize: 20, flex: 1 }]}>{trip.name}</Text>
              <View style={shared.badge}>
                <Text style={shared.badgeText}>{trip.status}</Text>
              </View>
            </View>
            {trip.description ? (
              <Text style={[shared.cardMeta, { marginTop: 8 }]}>{trip.description}</Text>
            ) : null}
            <Text style={{ color: colors.emerald, fontWeight: '600', marginTop: 12 }}>
              {formatCurrency(trip.expenseTotal ?? 0, trip.currency)} spent
            </Text>
            <TouchableOpacity onPress={copyInvite} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.brandLight, fontSize: 13 }}>
                Invite: {trip.inviteCode} (tap to copy)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={shared.tabBar}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[shared.tab, tab === t.key && shared.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[shared.tabText, tab === t.key && shared.tabTextActive]} numberOfLines={1}>
                {t.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'expenses' && (
          <>
            {expenses.length === 0 ? (
              <Text style={shared.empty}>No expenses yet</Text>
            ) : (
              expenses.map((e) => (
                <TouchableOpacity key={e.id} style={shared.card} onLongPress={() => deleteExpense(e.id)}>
                  <View style={shared.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={shared.cardTitle}>{e.title}</Text>
                      <Text style={shared.cardMeta}>
                        {e.paidBy.name} · {e.category}
                      </Text>
                    </View>
                    <Text style={{ color: colors.emerald, fontWeight: '600' }}>
                      {formatCurrency(e.totalAmount, trip?.currency)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {tab === 'balances' && (
          <>
            {balances.map((b) => (
              <View key={b.userId} style={[shared.card, shared.row]}>
                <Text style={shared.cardTitle}>{b.name}</Text>
                <Text style={{ color: b.net >= 0 ? colors.emerald : colors.red, fontWeight: '600' }}>
                  {b.net >= 0 ? '+' : ''}
                  {formatCurrency(b.net, trip?.currency)}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={[shared.buttonOutline, { marginTop: 8 }]} onPress={() => setSettleOpen(true)}>
              <Text style={shared.buttonOutlineText}>Record settlement</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'settlements' && (
          <>
            {settlements.length === 0 ? (
              <Text style={shared.empty}>No settlements yet</Text>
            ) : (
              settlements.map((s) => (
                <View key={s.id} style={shared.card}>
                  <Text style={shared.cardTitle}>
                    {s.payer.name} → {s.payee.name}
                  </Text>
                  <View style={[shared.row, { marginTop: 6 }]}>
                    <Text style={{ color: colors.emerald, fontWeight: '600' }}>
                      {formatCurrency(s.amount, trip?.currency)}
                    </Text>
                    <Text style={shared.badgeText}>{s.status}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'members' && (
          <>
            {isAdmin && (
              <TouchableOpacity style={[shared.button, { marginBottom: 12 }]} onPress={openAddMember}>
                <Text style={shared.buttonText}>+ Add member</Text>
              </TouchableOpacity>
            )}
            {trip?.members.map((m) => {
              const bal = balances.find((b) => b.userId === m.userId);
              return (
                <View key={m.id} style={[shared.card, shared.row, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={shared.cardTitle}>{memberName(m)}</Text>
                    <Text style={shared.cardMeta}>@{m.user?.username}</Text>
                    {bal && (
                      <Text
                        style={{
                          color: bal.net >= 0 ? colors.emerald : colors.red,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {bal.net >= 0 ? 'Gets back' : 'Owes'}{' '}
                        {formatCurrency(Math.abs(bal.net), trip.currency)}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={shared.badge}>
                      <Text style={shared.badgeText}>{m.role}</Text>
                    </View>
                    {canRemoveMember(m, currentRole) && (
                      <TouchableOpacity onPress={() => confirmRemoveMember(m)}>
                        <Text style={{ color: colors.red, fontSize: 12 }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={shared.fab} onPress={() => setExpenseOpen(true)}>
        <Text style={shared.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add expense modal */}
      <Modal visible={expenseOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Add expense</Text>
            <TextInput style={shared.input} placeholder="Title" placeholderTextColor={colors.textMuted} value={expTitle} onChangeText={setExpTitle} />
            <TextInput style={shared.input} placeholder="Amount" placeholderTextColor={colors.textMuted} value={expAmount} onChangeText={setExpAmount} keyboardType="decimal-pad" />
            <Text style={shared.sectionTitle}>Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {trip?.members.map((m) => (
                <TouchableOpacity
                  key={m.userId}
                  style={[
                    shared.badge,
                    { marginRight: 8, paddingVertical: 8, paddingHorizontal: 12 },
                    paidByUserId === m.userId && { backgroundColor: 'rgba(124,58,237,0.2)' },
                  ]}
                  onPress={() => setPaidByUserId(m.userId)}
                >
                  <Text style={shared.badgeText}>{memberName(m)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
              Split equally between all members
            </Text>
            <TouchableOpacity style={shared.button} onPress={handleAddExpense} disabled={submitting}>
              <Text style={shared.buttonText}>{submitting ? 'Adding…' : 'Add expense'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setExpenseOpen(false)}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add member modal */}
      <Modal visible={memberOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Add member</Text>
            <TextInput
              style={shared.input}
              placeholder="Search username…"
              placeholderTextColor={colors.textMuted}
              value={memberSearch}
              onChangeText={searchUsers}
              autoCapitalize="none"
            />
            <FlatList
              data={memberSearch.length >= 2 ? searchResults.filter((u) => !memberIds.has(u.id)) : availableFriends.map((f) => ({ ...f.user, friendshipStatus: 'FRIENDS' as const }))}
              keyExtractor={(item) => 'id' in item ? item.id : (item as { id: string }).id}
              style={{ maxHeight: 280 }}
              ListHeaderComponent={
                memberSearch.length < 2 && availableFriends.length > 0 ? (
                  <Text style={shared.sectionTitle}>Friends</Text>
                ) : null
              }
              renderItem={({ item }) => {
                const u = item as { id: string; name: string; username: string };
                return (
                  <View style={[shared.card, shared.row, { marginBottom: 8 }]}>
                    <View>
                      <Text style={shared.cardTitle}>{u.name}</Text>
                      <Text style={shared.cardMeta}>@{u.username}</Text>
                    </View>
                    <TouchableOpacity onPress={() => addMemberToTrip(u.id)} disabled={submitting}>
                      <Text style={{ color: colors.brandLight, fontWeight: '600' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setMemberOpen(false)}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settle modal */}
      <Modal visible={settleOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Settle up</Text>
            <Text style={shared.sectionTitle}>Payer</Text>
            {trip?.members.map((m) => (
              <TouchableOpacity key={`p-${m.userId}`} onPress={() => setSettlePayer(m.userId)} style={{ paddingVertical: 6 }}>
                <Text style={{ color: settlePayer === m.userId ? colors.brandLight : colors.text }}>
                  {memberName(m)}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={[shared.sectionTitle, { marginTop: 12 }]}>Payee</Text>
            {trip?.members.map((m) => (
              <TouchableOpacity key={`e-${m.userId}`} onPress={() => setSettlePayee(m.userId)} style={{ paddingVertical: 6 }}>
                <Text style={{ color: settlePayee === m.userId ? colors.brandLight : colors.text }}>
                  {memberName(m)}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput style={shared.input} placeholder="Amount" placeholderTextColor={colors.textMuted} value={settleAmount} onChangeText={setSettleAmount} keyboardType="decimal-pad" />
            <TouchableOpacity style={shared.button} onPress={handleSettle} disabled={submitting}>
              <Text style={shared.buttonText}>{submitting ? 'Saving…' : 'Record payment'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setSettleOpen(false)}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
