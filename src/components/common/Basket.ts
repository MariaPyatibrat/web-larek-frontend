// src/components/common/Basket.ts
import { ensureElement } from '../../utils/utils';
import { IBasketItem } from '../../types';

export class Basket {
    protected _list: HTMLElement;
    protected _total: HTMLElement;
    protected _button: HTMLButtonElement;

    constructor(protected container: HTMLElement) {
        this._list = ensureElement<HTMLElement>('.basket__list', container);
        this._total = ensureElement<HTMLElement>('.basket__price', container);
        this._button = container.querySelector('.basket__button, .button') as HTMLButtonElement;
    }

    // Метод для установки товаров в корзину
    set items(items: IBasketItem[]) {
        this._list.innerHTML = ''; // Очищаем корзину
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('basket__item', 'card', 'card_compact');
            li.innerHTML = `
        <span class="basket__item-index">${index + 1}</span>
        <span class="card__title">${item.title}</span>
        <span class="card__price">${item.price} синапсов</span>
        <button class="basket__item-delete" aria-label="удалить"></button>
    `;
            li.dataset.id = item.id;
            this._list.appendChild(li);
        });
    }

    // Метод для установки общей суммы в корзине
    set total(value: number) {
        this.setText(this._total, `${value} синапсов`);
    }

    // Утилита для установки текста в элемент
    private setText(element: HTMLElement, text: string): void {
        if (element) element.textContent = text;
    }
}

