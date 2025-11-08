// app/menu.tsx
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addCategory, addMenuItem, deleteCategory, deleteMenuItem, getCategories, getMenuItems, updateCategory, updateMenuItem } from '../src/services/database';
import { MenuItem } from '../types';

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [editCatId, setEditCatId] = useState<number | null>(null);

  useEffect(() => {
    const load = () => {
      setItems(getMenuItems());
      setCategories(getCategories());
    };
    load();
  }, []);

  const save = () => {
    const p = parseFloat(price);
    if (!name || isNaN(p)) return Alert.alert('Lỗi', 'Nhập đầy đủ');
    if (editId) {
      updateMenuItem(editId, name, p, selectedCategory || 1);
    } else {
      addMenuItem(name, p, selectedCategory || 1);
    }
    setItems(getMenuItems());
    setName(''); setPrice(''); setEditId(null); setSelectedCategory(null);
  };

  const addNewCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setCategories(getCategories());
      setNewCatName('');
    }
  };

  const editCategory = (id: number, name: string) => {
    setEditCatId(id);
    setNewCatName(name);
  };

  const saveCategory = () => {
    if (editCatId && newCatName.trim()) {
      updateCategory(editCatId, newCatName.trim());
      setCategories(getCategories());
      setEditCatId(null);
      setNewCatName('');
    }
  };

  const removeCategory = (id: number) => {
    Alert.alert('Xóa danh mục', 'Chuyển món về danh mục mặc định?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        onPress: () => {
          deleteCategory(id);
          // RELOAD LẠI DANH MỤC VÀ MÓN
          setCategories(getCategories());
          setItems(getMenuItems());
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý thực đơn</Text>

      {/* DANH MỤC */}
      <View style={styles.catSection}>
        <Text style={styles.label}>Danh mục:</Text>
        <FlatList
          data={categories}
          horizontal
          keyExtractor={i => i.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.catItem}>
              <TouchableOpacity
                style={[styles.catBtn, selectedCategory === item.id && styles.catBtnActive]}
                onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
              >
                <Text style={[styles.catText, selectedCategory === item.id && styles.catTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
              <View style={styles.catActions}>
                <Button title="Sửa" onPress={() => editCategory(item.id, item.name)} />
                <Button title="Xóa" color="red" onPress={() => removeCategory(item.id)} />
              </View>
            </View>
          )}
        />
        <View style={styles.addCat}>
          <TextInput
            placeholder={editCatId ? "Sửa danh mục" : "Tên danh mục mới"}
            value={newCatName}
            onChangeText={setNewCatName}
            style={styles.inputSmall}
          />
          <Button title={editCatId ? "Lưu" : "+"} onPress={editCatId ? saveCategory : addNewCategory} color={editCatId ? "#27ae60" : "#FF6B35"} />
        </View>
      </View>

      {/* THÊM MÓN */}
      <TextInput placeholder="Tên món" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Giá" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
      <Button title={editId ? "Cập nhật" : "Thêm món"} onPress={save} color="#e67e22" />

      {/* DANH SÁCH MÓN */}
      <FlatList
        data={items}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} - {item.price.toLocaleString()}đ ({item.category_name})</Text>
            <View style={styles.actions}>
              <Button title="Sửa" onPress={() => { setEditId(item.id); setName(item.name); setPrice(item.price.toString()); setSelectedCategory(item.category_id); }} />
              <Button title="Xóa" color="red" onPress={() => { deleteMenuItem(item.id); setItems(getMenuItems()); }} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 16 },
  catSection: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  catItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  catBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, elevation: 2 },
  catBtnActive: { backgroundColor: '#FF6B35' },
  catText: { fontSize: 15, fontWeight: '600', color: '#555' },
  catTextActive: { color: '#fff', fontWeight: '700' },
  catActions: { flexDirection: 'row', marginLeft: 8 },
  addCat: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  inputSmall: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 12, marginRight: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 12, marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
});