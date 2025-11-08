// src/services/database.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('ocna.db');
let isInitialized = false;

// KEY KIỂM TRA ĐÃ KHỞI TẠO CHƯA
const INIT_KEY = 'db_initialized';

export const initDatabase = async () => {
  const alreadyInit = await AsyncStorage.getItem(INIT_KEY);
  if (alreadyInit === 'true') return;

  try {
    db.runSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      );
    `);
    db.runSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      );
    `);
    db.runSync(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category_id INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );
    `);
    db.runSync(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        status TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    db.runSync(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        menu_item_id INTEGER,
        quantity INTEGER,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
      );
    `);

    // CHỈ THÊM DỮ LIỆU MẪU 1 LẦN
    db.runSync(`INSERT OR IGNORE INTO categories (name) VALUES ('Ốc'), ('Hải sản'), ('Nước uống');`);
    db.runSync(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', '123', 'admin');`);

    await AsyncStorage.setItem(INIT_KEY, 'true'); // ĐÁNH DẤU ĐÃ KHỞI TẠO
  } catch (err) {
    console.error('INIT DB FAILED:', err);
  }
};

export const loginUser = (username: string, password: string): { role: string } | null => {
  const user = db.getFirstSync<{ role: string }>(`SELECT role FROM users WHERE username = ? AND password = ?;`, [username, password]);
  return user || null;
};

// CHỈ KHAI BÁO 1 LẦN
export const getMenuItems = (): { id: number; name: string; price: number; category_id: number; category_name: string }[] => {
  return db.getAllSync(`
    SELECT mi.id, mi.name, mi.price, mi.category_id, c.name as category_name
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    ORDER BY mi.name;
  `);
};

export const getCategories = (): { id: number; name: string }[] => {
  return db.getAllSync(`SELECT id, name FROM categories ORDER BY name;`);
};

// CÁC HÀM KHÁC GIỮ NGUYÊN...
export const addMenuItem = (name: string, price: number, category_id: number): void => {
  db.runSync(`INSERT INTO menu_items (name, price, category_id) VALUES (?, ?, ?);`, [name, price, category_id]);
};

export const updateMenuItem = (id: number, name: string, price: number, category_id: number): void => {
  db.runSync(`UPDATE menu_items SET name = ?, price = ?, category_id = ? WHERE id = ?;`, [name, price, category_id, id]);
};

export const deleteMenuItem = (id: number): void => {
  db.runSync(`DELETE FROM menu_items WHERE id = ?;`, [id]);
};

export const addCategory = (name: string): void => {
  db.runSync('INSERT INTO categories (name) VALUES (?);', [name]);
};

export const updateCategory = (id: number, name: string): void => {
  db.runSync('UPDATE categories SET name = ? WHERE id = ?;', [name, id]);
};

export const deleteCategory = (id: number): void => {
  db.runSync('UPDATE menu_items SET category_id = 1 WHERE category_id = ?;', [id]);
  db.runSync('DELETE FROM categories WHERE id = ?;', [id]);
};

export const createOrder = (tableName: string): number => {
  const result = db.runSync(`INSERT INTO orders (table_name, status) VALUES (?, 'open');`, [tableName]);
  return result.lastInsertRowId;
};

export const getOrderByTable = (tableName: string): { order_id: number; menu_item_id: number; quantity: number }[] => {
  return db.getAllSync(`
    SELECT oi.*, o.id as order_id
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.table_name = ? AND o.status = 'open';
  `, [tableName]);
};

// THÊM HÀM ASYNC
export const addItemToOrderAsync = async (orderId: number, menuItemId: number, quantity: number | -1): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const existing = db.getFirstSync<{ id: number; quantity: number }>(
        `SELECT id, quantity FROM order_items WHERE order_id = ? AND menu_item_id = ?;`,
        [orderId, menuItemId]
      );

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) {
          db.runSync(`DELETE FROM order_items WHERE id = ?;`, [existing.id]);
        } else {
          db.runSync(`UPDATE order_items SET quantity = ? WHERE id = ?;`, [newQty, existing.id]);
        }
      } else if (quantity > 0) {
        db.runSync(`INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?);`, [orderId, menuItemId, quantity]);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const updateOrderStatus = (orderId: number, status: string): void => {
  db.runSync(`UPDATE orders SET status = ? WHERE id = ?;`, [status, orderId]);
};

export const getActiveTables = (): string[] => {
  const rows = db.getAllSync(`SELECT DISTINCT table_name FROM orders WHERE status = 'open';`);
  return (rows as any[]).map((row: any) => row.table_name as string);
};

export const saveTables = async (tables: string[]): Promise<void> => {
  await AsyncStorage.setItem('tables', JSON.stringify(tables));
};

export const loadTables = async (): Promise<string[]> => {
  const saved = await AsyncStorage.getItem('tables');
  return saved ? JSON.parse(saved) : Array.from({ length: 12 }, (_, i) => `Bàn ${i + 1}`);
};

export const getRevenue = (days: number): number => {
  const sql = `
    SELECT SUM(mi.price * oi.quantity) as total
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'paid' AND DATE(o.created_at) >= DATE('now', ?);
  `;
  const result = db.getFirstSync<{ total: number }>(sql, [`-${days} days`]);
  return result?.total || 0;
};

export const getTopItems = (days: number): { name: string; total_qty: number; total_revenue: number }[] => {
  const sql = `
    SELECT mi.name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * mi.price) as total_revenue
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'paid' AND DATE(o.created_at) >= DATE('now', ?)
    GROUP BY mi.id
    ORDER BY total_qty DESC
    LIMIT 10;
  `;
  return db.getAllSync(sql, [`-${days} days`]) as any[];
};