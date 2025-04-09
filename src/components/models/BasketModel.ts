// src/components/models/BasketModel.ts

import { IProduct, IOrder, IOrderResult } from '../../types'; // Добавим импорт IProduct
import { ShopAPI } from '../ShopApi';
import { EventEmitter } from '../base/events';

export class BasketModel {
    private items: IProduct[] = [];  // Массив товаров в корзине

    constructor(private events: EventEmitter, private api: ShopAPI) {}

    // Метод для получения элементов корзины
    getItems(): IProduct[] {
        return this.items;
    }

    // Метод для получения общей суммы
    getTotal(): number {
        return this.items.reduce((total, item) => total + item.price, 0);
    }

    // Добавление товара в корзину
    add(product: IProduct) {
        this.items.push(product);
        this.events.emit('basket:changed', this.items);
    }

    // Удаление товара из корзины
    handleItemRemoval(itemId: string) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.events.emit('basket:changed', this.items); // Сигнализируем об изменении корзины
    }

    // Метод для создания заказа
    async createOrder(orderData: IOrder): Promise<IOrderResult> {
        try {
            // Отправка данных заказа на сервер через API
            const response = await this.api.createOrder(orderData);

            return response; // Возвращаем результат, полученный с сервера
        } catch (error) {
            console.error('Ошибка при создании заказа', error);
            throw new Error('Не удалось создать заказ');
        }
    }
}
