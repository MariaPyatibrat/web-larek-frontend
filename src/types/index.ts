// src/types/index.ts

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

export interface ICard {
    update(data: {
        id: string;
        title: string;
        price: string;
        category?: string;
        image?: string;
    }): void;
}

export interface IBasketItem {
    id: string;
    title: string;
    price: number;
}

export interface ApiListResponse<T> {
    total: number;
    items: T[];
}

export interface ICardActions {
    onClick: (event: MouseEvent) => void;
}
