// app/order.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  addItemToOrderAsync,
  createOrder,
  getCategories,
  getMenuItems,
  getOrderByTable,
  updateOrderStatus,
} from '../src/services/database';
import { printKitchenBill, printPaymentBill } from '../src/services/print';

// ĐẶT styles TRƯỚC return
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 16 },
  search: { backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 12, fontSize: 16, elevation: 2 },
  categoryList: { paddingVertical: 8, paddingHorizontal: 4 },
  categoryBtn: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, marginHorizontal: 6, elevation: 3, minWidth: 90, alignItems: 'center' },
  categoryBtnActive: { backgroundColor: '#FF6B35' },
  categoryText: { fontSize: 16, fontWeight: '600', color: '#555' },
  categoryTextActive: { color: '#fff', fontWeight: '700' },
  menuCard: { flex: 1, margin: 8, backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 3 },
  menuName: { fontSize: 16, fontWeight: '600' },
  menuPrice: { color: '#FF6B35', fontWeight: 'bold', marginVertical: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  qtyBtn: { backgroundColor: '#FF6B35', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  qty: { marginHorizontal: 14, fontSize: 16, fontWeight: '600' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  total: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#FF6B35' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  printBtn: { backgroundColor: '#3498db', padding: 14, borderRadius: 12, flex: 1, marginHorizontal: 8 },
  payBtn: { backgroundColor: '#27ae60', padding: 14, borderRadius: 12, flex: 1, marginHorizontal: 8 },
  printText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  payText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});

export default function OrderScreen() {
  const { tableName } = useLocalSearchParams<{ tableName: string }>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<Map<number, number>>(new Map());
  const [printedItems, setPrintedItems] = useState<Map<number, number>>(new Map());
  const [orderId, setOrderId] = useState<number | null>(null);

  const menu = useMemo(() => getMenuItems(), []);
  const categories = useMemo(() => getCategories(), []);

  useEffect(() => {
    const items = getOrderByTable(tableName);
    if (items.length > 0) {
      setOrderId(items[0].order_id);
      const map = new Map();
      items.forEach(i => map.set(i.menu_item_id, (map.get(i.menu_item_id) || 0) + i.quantity));
      setOrderItems(map);
      setPrintedItems(map);
    }
  }, [tableName]);

  // DEBOUNCE NHẤN NÚT
  const debouncedUpdate = useCallback(
    debounce((id: number, delta: number) => {
      updateQuantity(id, delta);
    }, 100),
    [orderId, tableName]
  );

  const updateQuantity = useCallback(async (id: number, delta: number) => {
    setOrderItems(prev => {
      const current = prev.get(id) || 0;
      const newQty = Math.max(0, current + delta);
      const newMap = new Map(prev);
      if (newQty === 0) newMap.delete(id);
      else newMap.set(id, newQty);
      return newMap;
    });

    try {
      if (!orderId && delta > 0) {
        const newOrderId = createOrder(tableName);
        setOrderId(newOrderId);
        await addItemToOrderAsync(newOrderId, id, delta);
      } else if (orderId) {
        await addItemToOrderAsync(orderId, id, delta);
      }
    } catch (err) {
      console.error('UPDATE ORDER ERROR:', err);
    }
  }, [orderId, tableName]);

  const total = useMemo(() => {
    return Array.from(orderItems.entries()).reduce((sum, [id, qty]) => {
      const item = menu.find(m => m.id === id);
      return sum + (item?.price || 0) * qty;
    }, 0);
  }, [orderItems, menu]);

  const filteredMenu = useMemo(() => {
    const lower = search.toLowerCase();
    return menu.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(lower);
      const matchesCategory = selectedCategory === null || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, search, selectedCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tableName}</Text>

      <TextInput
        style={styles.search}
        placeholder="Tìm đi món gì cũng không có"
        onChangeText={setSearch}
        autoFocus={false}
      />

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryBtn, selectedCategory === item.id && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredMenu}
        numColumns={2}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          const qty = orderItems.get(item.id) || 0;
          return (
            <View style={styles.menuCard}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuPrice}>{item.price.toLocaleString()}đ</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => debouncedUpdate(item.id, -1)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => debouncedUpdate(item.id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Text style={styles.total}>Tổng: {total.toLocaleString()}đ</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.printBtn} onPress={() => {
              //tính toán các món mới/thay đổi
              const itemsToPrint = new Map<number, number>();

              orderItems.forEach((currentQty, id) => {
                const printedQty = printedItems.get(id) || 0;
                const diff = currentQty - printedQty;

                if(diff > 0){
                  itemsToPrint.set(id, diff);
                }
              });

              //kiểm tra xem có gì để in không
              if(itemsToPrint.size === 0){
                Alert.alert('thông báo', 'Không có món mới để in bếp.');
                console.log("không có món mới để in bếp.");
                return;
              }

              //Gọi hàm in chỉ với các món mới
              printKitchenBill(tableName, itemsToPrint, menu);
              //Cập nhật lại trạng thái "đã in"(chốt baseline mới)
              setPrintedItems(new Map(orderItems));
          }}>
            <Text style={styles.printText}>In bếp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payBtn} onPress={() => printPaymentBill(tableName, orderItems, menu, () => {
            if (orderId) updateOrderStatus(orderId, 'paid');
            router.back();
          })}>
            <Text style={styles.payText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}