import { IProduct, IOrder, IOrderResult } from '../../types';
import { ShopAPI } from '../ShopApi';
import { EventEmitter } from '../base/events';

export class BasketModel {
    private items: IProduct[] = [];

    constructor(private events: EventEmitter, private api: ShopAPI) {}

    // Метод для добавления товара в корзину
    add(product: IProduct) {
        this.items.push(product);
        this.events.emit('basket:changed', this.items);
    }

    // Метод для удаления товара по ID
    remove(productId: string) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index !== -1) {
            this.items.splice(index, 1); // Удаляем товар
            this.events.emit('basket:changed', this.items); // Обновляем корзину
        }
    }

    // Получение всех товаров из корзины
    getItems() {
        return this.items;
    }

    // Получение общей суммы корзины
    getTotal() {
        return this.items.reduce((total, item) => total + item.price, 0);
    }

    // Логика для оформления заказа
    async createOrder(orderData: IOrder) {
        // Пример отправки данных на сервер
        const response = await this.api.createOrder(orderData);
        return response;
    }

    // Метод для обработки удаления товара из корзины
    handleItemRemoval(itemId: string) {
        this.remove(itemId);
    }
}
