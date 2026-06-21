import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { UserSearchResult } from '@settl/types';
import { apiRequest, ApiError } from '../lib/api';
import { shared } from '../theme/styles';
import { colors } from '../theme/colors';

type FriendEntry = { id: string; user: { id: string; name: string; username: string }; since: string };
type RequestEntry = { id: string; user: { id: string; name: string; username: string }; createdAt: string };

export default function FriendsScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<RequestEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiRequest<FriendEntry[]>('/friends'),
        apiRequest<{ incoming: RequestEntry[]; outgoing: RequestEntry[] }>('/friends/requests'),
      ]);
      setFriends(friendsData);
      setIncoming(requestsData.incoming);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await apiRequest<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(text.trim())}`);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(userId: string) {
    try {
      await apiRequest('/friends/request', { method: 'POST', body: JSON.stringify({ userId }) });
      handleSearch(query);
      load();
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    }
  }

  async function acceptRequest(id: string) {
    try {
      await apiRequest(`/friends/${id}/accept`, { method: 'POST' });
      load();
      if (query.length >= 2) handleSearch(query);
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    }
  }

  async function removeFriend(id: string, username: string) {
    Alert.alert('Remove friend?', `Remove @${username} from your friends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/friends/${id}`, { method: 'DELETE' });
            load();
          } catch (e) {
            Alert.alert('Error', (e as ApiError).message);
          }
        },
      },
    ]);
  }

  function friendAction(user: UserSearchResult) {
    switch (user.friendshipStatus) {
      case 'FRIENDS':
        return <Text style={{ color: colors.emerald, fontSize: 12 }}>Friends</Text>;
      case 'PENDING_SENT':
        return <Text style={{ color: colors.textMuted, fontSize: 12 }}>Sent</Text>;
      case 'PENDING_RECEIVED':
        return (
          <TouchableOpacity onPress={() => user.friendshipId && acceptRequest(user.friendshipId)}>
            <Text style={{ color: colors.brandLight, fontWeight: '600', fontSize: 13 }}>Accept</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity onPress={() => sendRequest(user.id)}>
            <Text style={{ color: colors.brandLight, fontWeight: '600', fontSize: 13 }}>Add</Text>
          </TouchableOpacity>
        );
    }
  }

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.brand} />}
    >
      <TextInput
        style={shared.input}
        placeholder="Search username or name…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />
      {searching && <ActivityIndicator color={colors.brand} style={{ marginBottom: 12 }} />}

      {searchResults.length > 0 && (
        <>
          <Text style={shared.sectionTitle}>Search results</Text>
          {searchResults.map((user) => (
            <View key={user.id} style={[shared.card, shared.row]}>
              <View style={{ flex: 1 }}>
                <Text style={shared.cardTitle}>{user.name}</Text>
                <Text style={shared.cardMeta}>@{user.username}</Text>
              </View>
              {friendAction(user)}
            </View>
          ))}
        </>
      )}

      {incoming.length > 0 && (
        <>
          <Text style={[shared.sectionTitle, { marginTop: 16 }]}>Requests ({incoming.length})</Text>
          {incoming.map(({ id, user }) => (
            <View key={id} style={[shared.card, shared.row]}>
              <View style={{ flex: 1 }}>
                <Text style={shared.cardTitle}>{user.name}</Text>
                <Text style={shared.cardMeta}>@{user.username}</Text>
              </View>
              <TouchableOpacity onPress={() => acceptRequest(id)}>
                <Text style={{ color: colors.brandLight, fontWeight: '600' }}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      <Text style={[shared.sectionTitle, { marginTop: 16 }]}>Friends ({friends.length})</Text>
      {friends.length === 0 ? (
        <Text style={shared.empty}>Search users to add friends</Text>
      ) : (
        friends.map(({ id, user }) => (
          <View key={id} style={[shared.card, shared.row]}>
            <View style={{ flex: 1 }}>
              <Text style={shared.cardTitle}>{user.name}</Text>
              <Text style={shared.cardMeta}>@{user.username}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFriend(id, user.username)}>
              <Text style={{ color: colors.red, fontSize: 13 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}
