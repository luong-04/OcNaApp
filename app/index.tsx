// app/index.tsx
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ốc Na</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
        <Text style={styles.btnText}>Bắt đầu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FF6B35', marginBottom: 40 },
  btn: { backgroundColor: '#FF6B35', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});