import { EventEmitter } from '../base/events';
import { IProduct } from '../../types';
import { ShopAPI } from '../ShopApi';

export class ProductModel {
    private products: IProduct[] = [];

    constructor(private events: EventEmitter, private api: ShopAPI) {}

    async load(): Promise<void> {
        try {
            this.products = await this.api.getProductList();
            this.events.emit('products:loaded', this.products);
        } catch (error) {
            console.error('Ошибка при загрузке продуктов:', error);
            throw error;
        }
    }

    getProductById(id: string): IProduct | undefined {
        return this.products.find(item => item.id === id);
    }
}