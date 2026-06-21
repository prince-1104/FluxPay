import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/auth';
import { apiRequest, ApiError } from '../lib/api';
import { shared } from '../theme/styles';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [planTier, setPlanTier] = useState('FREE');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setName(user?.name ?? '');
      setUsername(user?.username ?? '');
      apiRequest<{ plan: { tier: string } }>('/users/subscription')
        .then((sub) => setPlanTier(sub?.plan?.tier ?? 'FREE'))
        .catch(() => setPlanTier('FREE'));
    }, [user])
  );

  async function handleSave() {
    setSaving(true);
    try {
      await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, username }),
      });
      Alert.alert('Saved', 'Profile updated');
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View style={shared.card}>
        <Text style={shared.cardMeta}>Plan</Text>
        <Text style={[shared.cardTitle, { fontSize: 20, marginTop: 4 }]}>{planTier}</Text>
      </View>

      <Text style={shared.sectionTitle}>Profile</Text>
      <TextInput
        style={shared.input}
        placeholder="Name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={shared.input}
        placeholder="Username"
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={[shared.input, { opacity: 0.6 }]}
        value={user?.email ?? ''}
        editable={false}
      />

      <TouchableOpacity style={shared.button} onPress={handleSave} disabled={saving}>
        <Text style={shared.buttonText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[shared.buttonOutline, { marginTop: 24, borderColor: 'rgba(239,68,68,0.3)' }]}
        onPress={() => logout()}
      >
        <Text style={{ color: colors.red, fontWeight: '600' }}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
