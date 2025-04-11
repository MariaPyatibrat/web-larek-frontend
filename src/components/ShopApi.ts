import { Api, ApiListResponse } from './base/api';
import { IProduct, IOrder, IOrderResult } from '../types';

export class ShopAPI extends Api {
    readonly cdn: string;

    constructor(cdn: string, baseUrl: string, options?: RequestInit) {
        super(baseUrl, options);
        this.cdn = cdn;
    }

    async getProductList(): Promise<IProduct[]> {
        const response = await this.get('/product');
        if (!response || !(response as ApiListResponse<IProduct>).items) {
            throw new Error('Неверный формат данных продуктов');
        }
        const data = response as ApiListResponse<IProduct>;
        return data.items.map(item => ({
            ...item,
            image: this.cdn + item.image
        }));
    }

    async createOrder(order: IOrder): Promise<IOrderResult> {
        try {
            const response = await this.post('/order', order);

            if (!response) {
                throw new Error('Отсутствует ответ от сервера');
            }

            if ('id' in response) {
                return response as IOrderResult;
            } else {
                throw new Error('Неверный формат данных заказа');
            }
        } catch (error) {
            console.error('Ошибка при создании заказа:', error);
            throw new Error('Не удалось создать заказ');
        }
    }
}
