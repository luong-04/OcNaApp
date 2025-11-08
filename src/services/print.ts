// src/services/print.ts
import * as Print from 'expo-print';
import { MenuItem } from '../../types';

export const printKitchenBill = async (tableName: string, orderItems: Map<number, number>, menu: MenuItem[]) => {
  const items = Array.from(orderItems.entries())
    .map(([id, qty]) => {
      const item = menu.find(m => m.id === id);
      return item ? `${item.name} x${qty}` : '';
    })
    .filter(Boolean);

  if (items.length === 0) return;

  const html = `
    <div style="padding:20px; font-family:Arial;">
      <h2 style="text-align:center; color:#FF6B35;">ỐC NA - BẾP</h2>
      <p><strong>Bàn:</strong> ${tableName}</p>
      <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <hr>
      ${items.map(i => `<p style="font-size:18px; margin:8px 0;">${i}</p>`).join('')}
      <p style="text-align:center; margin-top:20px; color:#7f8c8d;">Vui lòng chế biến</p>
    </div>
  `;

  await Print.printAsync({ html, width: 300 });
};

export const printPaymentBill = async (tableName: string, orderItems: Map<number, number>, menu: MenuItem[], onPaid?: () => void) => {
  const items = Array.from(orderItems.entries())
    .map(([id, qty]) => {
      const item = menu.find(m => m.id === id);
      return item ? { ...item, quantity: qty } : null;
    })
    .filter(Boolean);

  const total = items.reduce((sum, i) => sum + i!.price * i!.quantity, 0);

  const html = `
    <div style="padding:20px; font-family:Arial; max-width:300px; margin:auto;">
      <h2 style="text-align:center; color:#FF6B35;">ỐC NA</h2>
      <p><strong>Bàn:</strong> ${tableName}</p>
      <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <hr>
      <table width="100%">
        ${items.map(i => `
          <tr>
            <td>${i!.name}</td>
            <td style="text-align:right;">x${i!.quantity}</td>
            <td style="text-align:right;">${(i!.price * i!.quantity).toLocaleString()}đ</td>
          </tr>
        `).join('')}
      </table>
      <hr>
      <p style="text-align:right; font-weight:bold; font-size:18px;">
        Tổng: ${total.toLocaleString()}đ
      </p>
      <p style="text-align:center; margin-top:20px; color:#7f8c8d;">Cảm ơn quý khách!</p>
    </div>
  `;

  await Print.printAsync({ html, width: 300 });
  onPaid?.();
};