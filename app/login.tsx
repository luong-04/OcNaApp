// app/login.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginUser } from '../src/services/database';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ!');
      return;
    }
    const user = loginUser(username, password);
    if (user) {
      router.replace({ pathname: '/home', params: { role: user.role } });
    } else {
      Alert.alert('Sai tài khoản hoặc mật khẩu!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput style={styles.input} placeholder="Tài khoản" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9f9f9' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, fontSize: 16, elevation: 2 },
  btn: { backgroundColor: '#FF6B35', padding: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 18 },
});