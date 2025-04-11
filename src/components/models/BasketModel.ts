import { IProduct, IOrder } from '../../types';
import { ShopAPI } from '../ShopApi';
import { EventEmitter } from '../base/events';

export class BasketModel {
    private items: IProduct[] = [];
    private orderData: Partial<IOrder> = {}; // Добавляем хранилище для данных заказа

    constructor(private events: EventEmitter, private api: ShopAPI) {}

    // Добавляем методы для работы с данными заказа
    setOrderField<K extends keyof IOrder>(field: K, value: IOrder[K]) {
        this.orderData[field] = value;
        this.events.emit('order:changed', this.orderData);
    }

    getOrderData(): Partial<IOrder> {
        return this.orderData;
    }

    // Остальные методы остаются без изменений
    add(product: IProduct) {
        this.items.push(product);
        this.events.emit('basket:changed', this.items);
    }

    remove(productId: string) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.events.emit('basket:changed', this.items);
        }
    }

    getItems() {
        return this.items;
    }

    getTotal() {
        return this.items.reduce((total, item) => total + item.price, 0);
    }

    async createOrder(orderData: IOrder) {
        const response = await this.api.createOrder(orderData);
        return response;
    }

    handleItemRemoval(itemId: string) {
        this.remove(itemId);
    }

    clear() {
        this.items = [];
        this.orderData = {};
        this.events.emit('basket:changed', this.items);
    }
}