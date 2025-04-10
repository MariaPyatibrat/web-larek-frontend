import { BasketModel } from '../models/BasketModel';
import { IBasketItem } from '../../types';
import { ensureElement } from '../../utils/utils';

export class Basket {
    protected _list: HTMLElement;
    protected _total: HTMLElement;
    protected _button: HTMLButtonElement;
    private basketModel: BasketModel;

    constructor(protected container: HTMLElement, basketModel: BasketModel) {
        this._list = ensureElement<HTMLElement>('.basket__list', container);
        this._total = ensureElement<HTMLElement>('.basket__price', container);
        this._button = container.querySelector('.basket__button, .button') as HTMLButtonElement;

        this.basketModel = basketModel;

        // Инициализация слушателя событий для кнопок удаления
        this._list.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('basket__item-delete')) {
                const itemId = target.closest('li')?.dataset.id;
                if (itemId) {
                    this.removeItem(itemId);  // Удаление товара по id
                }
            }
        });
    }

    // Устанавливаем товары в корзину
    set items(items: IBasketItem[]) {
        this._list.innerHTML = '';

        if (items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Корзина пуста';
            this._list.appendChild(emptyMessage);

            this.updateBasketCounter(0);
            this._button.disabled = true;
            this.total = 0; // 👉 Обнуляем сумму
            return;
        }

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

        this.updateBasketCounter(items.length);
        this._button.disabled = false;

        const totalPrice = items.reduce((sum, item) => sum + item.price, 0); // 👉 Пересчитываем сумму
        this.total = totalPrice; // 👉 Обновляем UI
    }



    // Удаляем товар через модель
    private removeItem(itemId: string) {
        console.log(`Удаляем товар с ID: ${itemId}`);  // Логируем удаление товара

        // Удаляем товар из DOM по уникальному ID
        const item = this._list.querySelector(`[data-id="${itemId}"]`);
        if (item) {
            item.remove();  // Убираем элемент из DOM
        }

        // Отправляем событие об изменении корзины
        this.container.dispatchEvent(new CustomEvent('basket:itemRemoved', { detail: itemId }));

        // Обновляем корзину после удаления товара
        this.basketModel.handleItemRemoval(itemId);  // Используем метод модели для удаления товара

        // Обновляем отображение корзины с актуальными данными
        const updatedItems = this.basketModel.getItems();  // Получаем актуальные товары из модели
        this.items = updatedItems;  // Обновляем отображение корзины
    }

    // Обновляем счетчик товаров в корзине
    private updateBasketCounter(count: number) {
        const basketCounter = document.querySelector('.header__basket-counter') as HTMLElement;
        if (basketCounter) {
            basketCounter.textContent = count.toString();
        }
    }

    // Устанавливаем общую сумму
    set total(value: number) {
        this.setText(this._total, `${value} синапсов`);
    }

    // Утилита для установки текста в элемент
    private setText(element: HTMLElement, text: string): void {
        if (element) element.textContent = text;
    }
}