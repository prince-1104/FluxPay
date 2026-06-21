import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiRequest } from '../lib/api';
import { shared } from '../theme/styles';
import { colors } from '../theme/colors';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiRequest<Notification[]>('/notifications');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function markRead(id: string) {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      load();
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      load();
    } catch {
      // ignore
    }
  }

  return (
    <View style={shared.screen}>
      {items.some((n) => !n.readAt) && (
        <TouchableOpacity style={{ padding: 16, alignItems: 'flex-end' }} onPress={markAllRead}>
          <Text style={{ color: colors.brandLight, fontWeight: '600' }}>Mark all read</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.brand} />}
        ListEmptyComponent={<Text style={shared.empty}>No notifications</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              shared.card,
              !item.readAt && { borderColor: 'rgba(124,58,237,0.3)', backgroundColor: 'rgba(124,58,237,0.08)' },
            ]}
            onPress={() => !item.readAt && markRead(item.id)}
          >
            <Text style={shared.cardTitle}>{item.title}</Text>
            <Text style={[shared.cardMeta, { marginTop: 6 }]}>{item.body}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8 }}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
