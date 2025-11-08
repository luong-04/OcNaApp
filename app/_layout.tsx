// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../src/services/database';

export default function RootLayout() {
  useEffect(() => {
    initDatabase(); // CHỈ CHẠY 1 LẦN KHI APP MỞ
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
      <Stack.Screen name="order" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="report" />
    </Stack>
  );
}