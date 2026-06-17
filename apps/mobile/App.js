import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settl</Text>
      <Text style={styles.subtitle}>SaaS Group Trip Expense Splitting</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#7C3AED',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(248, 248, 255, 0.6)',
    fontSize: 16,
  },
});
