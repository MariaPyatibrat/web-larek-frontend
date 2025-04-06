import { Api, ApiListResponse } from './base/api';
import { IProduct, IOrder, IOrderResult } from '../types';

export class ShopAPI extends Api {
    readonly cdn: string;

    constructor(cdn: string, baseUrl: string, options?: RequestInit) {
        super(baseUrl, options);
        this.cdn = cdn;
    }

    getProductList(): Promise<IProduct[]> {
        return this.get('/product').then((data: ApiListResponse<IProduct>) =>
            data.items.map(item => ({
                ...item,
                image: this.cdn + item.image
            }))
        );
    }

    createOrder(order: IOrder): Promise<IOrderResult> {
        return this.post('/order', order).then(
            (data: IOrderResult) => data
        );
    }
}