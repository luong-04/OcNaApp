// app/home.tsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getActiveTables, loadTables, saveTables } from '../src/services/database';

export default function HomeScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [tables, setTables] = useState<string[]>([]);
  const [activeTables, setActiveTables] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  useEffect(() => {
    const init = async () => {
      const list = await loadTables();
      setTables(list);
    };
    init();

    const interval = setInterval(() => {
      setActiveTables(getActiveTables());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addTable = () => {
    setNewTableName('');
    setModalVisible(true);
  };

  const confirmAddTable = async () => {
    const name = newTableName.trim();
    if (name && !tables.includes(name)) {
      const newTables = [...tables, name];
      setTables(newTables);
      await saveTables(newTables);
      setModalVisible(false);
    } else {
      Alert.alert('Lỗi', 'Tên bàn trống hoặc đã tồn tại!');
    }
  };

  const deleteTable = (tableName: string) => {
    Alert.alert('Xóa bàn', `Xóa "${tableName}"?`, [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const newTables = tables.filter(t => t !== tableName);
          setTables(newTables);
          await saveTables(newTables);
        }
      }
    ]);
  };

  const logout = () => {
    router.replace('/login');
  };

  const renderTable = useMemo(() => ({ item }: { item: string }) => {
    const isActive = activeTables.includes(item);
    return (
      <TouchableOpacity
        style={[styles.table, isActive && styles.tableActive]}
        onPress={() => router.push({ pathname: '/order', params: { tableName: item } })}
        onLongPress={() => role === 'admin' && deleteTable(item)}
      >
        <Text style={[styles.tableText, isActive && styles.tableTextActive]}>{item}</Text>
        {isActive && <Text style={styles.status}>Đang dùng</Text>}
      </TouchableOpacity>
    );
  }, [activeTables, role]);

  return (
    <View style={styles.container}>
      {/* HEADER: LOGO + ĐĂNG XUẤT */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')} // ĐẶT LOGO TẠI: assets/logo.png
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Chọn bàn</Text>

      {role === 'admin' && (
        <View style={styles.adminRow}>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/menu')}>
            <Text style={styles.btnText}>Thực đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/report')}>
            <Text style={styles.btnText}>Báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={addTable}>
            <Text style={styles.btnText}>+ Thêm bàn</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tables}
        numColumns={3}
        keyExtractor={item => item}
        contentContainerStyle={styles.grid}
        renderItem={renderTable}
        extraData={activeTables}
      />

      {/* MODAL THÊM BÀN */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm bàn mới</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập tên bàn (VD: Bàn 13)"
              value={newTableName}
              onChangeText={setNewTableName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button title="Hủy" onPress={() => setModalVisible(false)} color="#999" />
              <Button title="Thêm" onPress={confirmAddTable} color="#FF6B35" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  logo: { width: 120, height: 50 },
  logoutBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 20 },
  adminRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  btn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 16, minWidth: 110, elevation: 3 },
  btnText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 15 },
  grid: { paddingBottom: 20 },
  table: { flex: 1, margin: 8, height: 110, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  tableActive: { backgroundColor: '#FF6B35' },
  tableText: { fontSize: 17, fontWeight: '700', color: '#333' },
  tableTextActive: { color: '#fff' },
  status: { fontSize: 13, color: '#fff', marginTop: 6, backgroundColor: '#e74c3c', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 20, width: '85%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around' },
});