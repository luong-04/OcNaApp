export interface User{
    id: number;
    username: string;
    password: string;
    role: 'admin' | 'staff';
}

export interface MenuItem{
    id: number;
    name: string;
    price: number;
    category_id: number;
    category_name?: string;
}

export interface OrderItem{
    order_id: number;
    menu_item_id: number;
    name: string;
    price: number;
    quantity: number;
}