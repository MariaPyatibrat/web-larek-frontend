import { Component } from '../base/Component';
import { ensureElement } from '../../utils/utils';
import { IProduct } from '../../types';

export class Card extends Component<IProduct> {
    protected _image: HTMLImageElement;
    protected _title: HTMLElement;
    protected _price?: HTMLElement;
    protected _category?: HTMLElement;

    constructor(container: HTMLElement) {
        super(container);

        try {
            this._image = container.querySelector('.card__image') as HTMLImageElement;
            this._title = container.querySelector('.card__title') as HTMLElement;
            this._price = ensureElement<HTMLElement>('.card__price', container);
            this._category = container.querySelector('.card__category');
        } catch (error) {
            console.error('Ошибка создания карточки:', error);
        }
    }

    set id(value: string) {
        this.container.dataset.id = value;
    }

    set title(value: string) {
        if (this._title) this.setText(this._title, value);
    }

    set price(value: number) {
        if (this._price) this.setText(this._price, `${value} синапсов`);
    }

    set category(value: string) {
        if (this._category) {
            this._category.className = 'card__category';
            this._category.classList.add(`card__category_${value}`);
            this.setText(this._category, value);
        }
    }
}