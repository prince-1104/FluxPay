import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/auth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    try {
      await register(form);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {(['name', 'username', 'email', 'password'] as const).map((field) => (
        <TextInput
          key={field}
          style={styles.input}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          placeholderTextColor="#666"
          value={form[field]}
          onChangeText={(v) => setForm({ ...form, [field]: v })}
          secureTextEntry={field === 'password'}
          autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
        />
      ))}
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810', padding: 24, paddingTop: 16 },
  input: { backgroundColor: '#0F0F1A', borderRadius: 12, padding: 16, color: '#F8F8FF', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  button: { backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
