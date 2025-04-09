import { EventEmitter } from '../base/events';
import { IProduct, IOrder, IOrderResult } from '../../types';
import { ShopAPI } from '../ShopApi';

export class BasketModel {
    private items: IProduct[] = [];

    constructor(private events: EventEmitter, private api: ShopAPI) {}

    add(product: IProduct): void {
        if (!this.items.some(item => item.id === product.id)) {
            this.items.push(product);
            this.events.emit('basket:changed', this.items);
        }
    }

    remove(productId: string): void {
        this.items = this.items.filter(item => item.id !== productId);
        this.events.emit('basket:changed', this.items);
    }

    getItems(): IProduct[] {
        return this.items;
    }

    getTotal(): number {
        return this.items.reduce((total, item) => total + item.price, 0);
    }

    clear(): void {
        this.items = [];
        this.events.emit('basket:changed', this.items);
    }

    async createOrder(order: IOrder): Promise<IOrderResult> {
        try {
            const result = await this.api.createOrder(order);
            this.events.emit('order:completed', result);
            this.clear();
            return result;
        } catch (error) {
            console.error('Ошибка при создании заказа:', error);
            throw error;
        }
    }
}

