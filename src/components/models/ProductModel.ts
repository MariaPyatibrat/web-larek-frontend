import { EventEmitter } from '../base/events';

export interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
    image: string;
    category: string;
}

export class ProductModel {
    constructor(private events: EventEmitter) {}

    // Реализация методов модели
}