// src/components/common/Card.ts
import { ICard } from '../../types';
import { ensureElement } from '../../utils/utils';

export class Card implements ICard {
    protected _image: HTMLImageElement;
    protected _title: HTMLElement;
    protected _price?: HTMLElement;
    protected _category?: HTMLElement;

    constructor(protected container: HTMLElement) {
        try {
            this._image = container.querySelector('.card__image') as HTMLImageElement;
            this._title = container.querySelector('.card__title') as HTMLElement;
            this._price = ensureElement<HTMLElement>('.card__price', container);
            this._category = container.querySelector('.card__category') as HTMLElement;
        } catch (error) {
            console.error('Ошибка создания карточки:', error);
        }
    }


    // Метод для обновления данных в карточке
    update(data: {
        id: string;
        title: string;
        price: string;
        category?: string;
        image?: string;
    }): void {
        const { id, title, price, category, image } = data;

        if (this._title) {
            this._title.textContent = title;
        }

        if (this._price) {
            this._price.textContent = price;
        }

        if (this._category && category) {
            this._category.textContent = category;
        }

        if (this._image && image) {
            this._image.src = image;
            this._image.alt = title;
        }

        this.container.dataset.id = id;
    }

    // Установка id для карточки
    set id(value: string) {
        this.container.dataset.id = value;
    }

    // Установка заголовка карточки
    set title(value: string) {
        if (this._title) this.setText(this._title, value);
    }

    // Установка цены карточки
    set price(value: number) {
        if (this._price) this.setText(this._price, `${value} синапсов`);
    }

    // Установка категории карточки
    set category(value: string) {
        if (this._category) {
            this._category.className = 'card__category';
            this._category.classList.add(`card__category_${value}`);
            this.setText(this._category, value);
        }
    }

    // Утилита для установки текста в элемент
    private setText(element: HTMLElement, text: string): void {
        if (element) element.textContent = text;
    }
}
