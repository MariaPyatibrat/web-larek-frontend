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

        // Инициализация слушателя событий для кнопок удаления
        this._list.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;

            // Проверяем, что кликнули на кнопку удаления
            if (target.classList.contains('basket__item-delete')) {
                const itemId = target.closest('li')?.dataset.id;
                if (itemId) {
                    this.removeItem(itemId); // Удаление товара по id
                }
            }
        });
    }

    // Метод для установки товаров в корзину
    set items(items: IBasketItem[]) {
        console.log('Updating items:', items); // Логируем для проверки

        this._list.innerHTML = ''; // Очищаем корзину

        // Если корзина пуста, показываем сообщение
        if (items.length === 0) {
            console.log('Корзина пуста!'); // Логируем, если корзина пуста
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Корзина пуста';
            this._list.appendChild(emptyMessage);
            this.updateBasketCounter(0); // Обновляем счетчик корзины на 0
            return; // Прерываем выполнение метода, чтобы не добавлять элементы
        }

        // Иначе заполняем корзину товарами
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

        // Обновляем счетчик товаров в корзине
        this.updateBasketCounter(items.length);
    }

    // Метод для удаления товара из корзины
    private removeItem(itemId: string) {
        console.log(`Удаляем товар с ID: ${itemId}`); // Логируем удаление товара
        const item = this._list.querySelector(`[data-id="${itemId}"]`);
        item?.remove();
        this.container.dispatchEvent(new CustomEvent('basket:itemRemoved', { detail: itemId }));

        // Обновляем корзину после удаления товара
        const currentItems = Array.from(this._list.querySelectorAll('li')).map((li) => li.dataset.id);
        const remainingItems = currentItems.filter((id) => id !== itemId);

        // Применяем обновление списка товаров
        this.items = remainingItems.map((id) => {
            return { id, title: 'Товар', price: 0 }; // Можете заменить на реальные данные
        });
    }

    // Метод для обновления счетчика товаров в корзине
    private updateBasketCounter(count: number) {
        const basketCounter = document.querySelector('.header__basket-counter') as HTMLElement;
        if (basketCounter) {
            basketCounter.textContent = count.toString();
        }
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


