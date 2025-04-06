export interface IProduct {
    id: string;
    title: string;
    price: number;
    description: string;
    image: string;
    category: string;
}

export interface IOrder {
    payment: 'online' | 'offline';
    address: string;
    email: string;
    phone: string;
    items: string[];
    total: number;
}

export interface IOrderResult {
    id: string;
    total: number;
}

export interface ICardActions {
    onClick: (event: MouseEvent) => void;
}