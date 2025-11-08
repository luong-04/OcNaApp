// app/report.tsx
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRevenue, getTopItems } from '../src/services/database';

export default function ReportScreen() {
  const [period, setPeriod] = useState<'1' | '7' | '30' | '365'>('1'); // ép kiểu rõ ràng
  const revenue = getRevenue(parseInt(period));
  const topItems = getTopItems(parseInt(period));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Báo cáo doanh thu</Text>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Chọn thời gian:</Text>
        <Picker
          selectedValue={period}
          onValueChange={(itemValue) => setPeriod(itemValue as '1' | '7' | '30' | '365')}
          style={styles.picker}
        >
          <Picker.Item label="Hôm nay" value="1" />
          <Picker.Item label="7 ngày qua" value="7" />
          <Picker.Item label="30 ngày qua" value="30" />
          <Picker.Item label="1 năm qua" value="365" />
        </Picker>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tổng doanh thu</Text>
        <Text style={styles.amount}>{revenue.toLocaleString()}đ</Text>
      </View>

      <Text style={styles.subtitle}>Top 10 món bán chạy</Text>
      {topItems.length === 0 ? (
        <Text style={styles.noData}>Chưa có dữ liệu</Text>
      ) : (
        topItems.map((item, i) => (
          <View key={i} style={styles.topItem}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>SL: {item.total_qty} × {((item.total_revenue / item.total_qty) || 0).toLocaleString()}đ</Text>
              <Text style={styles.revenue}>Doanh thu: {item.total_revenue.toLocaleString()}đ</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 20 },
  pickerContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, elevation: 3 },
  pickerLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  picker: { height: 50, backgroundColor: '#f0f0f0', borderRadius: 12 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 3, alignItems: 'center' },
  label: { fontSize: 16, color: '#666' },
  amount: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginTop: 8 },
  subtitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  noData: { textAlign: 'center', color: '#999', fontStyle: 'italic', marginVertical: 20 },
  topItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, elevation: 2 },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#FF6B35', marginRight: 12, width: 40 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemDetail: { fontSize: 14, color: '#666' },
  revenue: { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
});