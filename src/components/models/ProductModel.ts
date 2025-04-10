import { IProduct } from '../../types';
import { EventEmitter } from '../base/events';
import { ShopAPI } from '../ShopApi';

export class ProductModel {
    constructor(
        protected events: EventEmitter,
        protected api: ShopAPI
    ) {}

    protected _items: IProduct[] = [];

    get items() {
        return this._items;
    }

    async load(): Promise<void> {
        try {
            const data = await this.api.getProductList();
            this._items = data;
            this.events.emit('products:loaded', this._items);
        } catch (error) {
            console.error('Ошибка при загрузке товаров:', error);
        }
    }

}
