import './scss/styles.scss';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/ShopApi';
import { ProductModel } from './components/models/ProductModel';
import { BasketModel } from './components/models/BasketModel';
import { Card } from './components/common/Card';
import { Basket } from './components/common/Basket';
import { API_URL, CDN_URL } from "./utils/constants";
import { Modal } from './components/common/Modal';
import { IProduct, IOrder, IOrderResult } from './types';

const events = new EventEmitter();
const api = new ShopAPI(CDN_URL, API_URL);
const productModel = new ProductModel(events, api);
const basketModel = new BasketModel(events, api);

document.addEventListener('DOMContentLoaded', async () => {
    let basket: Basket | null = null;

    try {
        const modalContainers = document.querySelectorAll('.modal');
        modalContainers.forEach(container => {
            if (container instanceof HTMLElement) {
                new Modal(container);
            }
        });

        const basketTemplate = document.querySelector('#basket');
        let basketContainer: HTMLElement | null = null;

        if (basketTemplate instanceof HTMLTemplateElement) {
            basketContainer = basketTemplate.content.firstElementChild as HTMLElement;
        } else {
            basketContainer = document.querySelector('.basket') as HTMLElement;
        }

        if (basketContainer) {
            basket = new Basket(basketContainer);
            console.log('Корзина инициализирована:', basket);
        }

        events.on('products:loaded', (products: IProduct[]) => {
            console.log('Товары пришли!', products);

            const gallery = document.querySelector('.gallery');
            if (!gallery) return console.error('Галерея не найдена!');

            const cardTemplate = document.querySelector('#card-catalog') as HTMLTemplateElement;
            if (!cardTemplate) return console.error('Шаблон карточки не найден!');

            gallery.innerHTML = '';

            products.forEach(product => {
                const fragment = cardTemplate.content.cloneNode(true) as DocumentFragment;
                const cardElement = fragment.firstElementChild as HTMLElement;
                const card = new Card(cardElement);

                card.update({
                    id: product.id,
                    title: product.title,
                    price: `${product.price} синапсов`,
                    category: product.category,
                    image: product.image
                });

                cardElement.addEventListener('click', () => {
                    events.emit('card:clicked', product);
                });

                const addToBasketButton = cardElement.querySelector('.card__button') as HTMLElement;
                if (addToBasketButton) {
                    addToBasketButton.addEventListener('click', () => {
                        if (basket) {
                            basketModel.add(product);
                            updateBasketCounter();
                        } else {
                            console.error('Корзина не инициализирована!');
                        }
                    });
                }

                gallery.appendChild(cardElement);
            });
        });

        await productModel.load();

        events.on<IProduct[]>('basket:changed', (items) => {
            console.log('Обновлены товары в корзине:', items);
            if (basket) {
                basket.items = items.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price
                }));
                basket.total = basketModel.getTotal();
                updateBasketCounter();
            }
        });

        const orderForm = document.querySelector('.order') as HTMLFormElement;
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(orderForm);
            const orderData: IOrder = {
                payment: formData.get('payment') as 'online' | 'offline',
                address: formData.get('address') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                items: basketModel.getItems().map(item => item.id),
                total: basketModel.getTotal()
            };

            await basketModel.createOrder(orderData);
        });

        events.on<IOrderResult>('order:completed', (result) => {
            const successModal = document.querySelector('.modal_success') as HTMLElement;
            if (successModal) {
                successModal.querySelector('.order-success__description')!.textContent =
                    `Списано ${result.total} синапсов`;
                successModal.style.display = 'flex';
            }
        });

        events.on('card:clicked', (product: IProduct) => {
            const modal = document.querySelector('.modal') as HTMLElement;
            if (!modal) return console.error('Модальное окно не найдено');

            const modalContent = modal.querySelector('.modal__content') as HTMLElement;
            if (!modalContent) return console.error('Содержимое модального окна не найдено');

            const template = document.querySelector('#card-preview') as HTMLTemplateElement;
            if (!template) return console.error('Шаблон предпросмотра карточки не найден!');

            const fragment = template.content.cloneNode(true) as DocumentFragment;
            const modalCardElement = fragment.firstElementChild as HTMLElement;

            const modalCard = new Card(modalCardElement);
            modalCard.update({
                id: product.id,
                title: product.title,
                price: `${product.price} синапсов`,
                category: product.category,
                image: product.image
            });

            const textElement = modalCardElement.querySelector('.card__text') as HTMLElement;
            if (textElement) textElement.textContent = product.description;

            modalContent.replaceChildren(modalCardElement);
            modal.classList.add('modal_active');
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked');
            document.querySelector('.page__wrapper')?.classList.add('page__wrapper_locked');
        });

        const basketButton = document.querySelector('.header__basket') as HTMLElement;
        basketButton.addEventListener('click', () => {
            const modal = document.querySelector('.modal') as HTMLElement;
            const modalContent = modal.querySelector('.modal__content') as HTMLElement;
            const basketTemplate = document.querySelector('#basket') as HTMLTemplateElement;

            if (!basketTemplate || !modal || !modalContent) {
                return console.error('Не найдены элементы модалки или шаблон корзины!');
            }

            const basketFragment = basketTemplate.content.cloneNode(true) as DocumentFragment;
            modalContent.replaceChildren(basketFragment);

            const basketList = modalContent.querySelector('.basket__list') as HTMLElement;
            const currentItems = basketModel.getItems();

            if (currentItems.length === 0) {
                basketList.innerHTML = '<p>Корзина пуста</p>';
            } else {
                basketList.innerHTML = '';
                currentItems.forEach((item, index) => {
                    const basketItem = document.createElement('li');
                    basketItem.classList.add('basket__item', 'card', 'card_compact');
                    basketItem.innerHTML = `
                        <span class="basket__item-index">${index + 1}</span>
                        <span class="card__title">${item.title}</span>
                        <span class="card__price">${item.price} синапсов</span>
                        <button class="basket__item-delete" aria-label="удалить"></button>
                    `;
                    basketList.appendChild(basketItem);
                });

                basketList.querySelectorAll('.basket__item-delete').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const basketItemElement = (event.target as HTMLElement).closest('.basket__item');
                        if (basketItemElement) {
                            const itemIndex = Array.from(basketItemElement.parentElement?.children || []).indexOf(basketItemElement);
                            const itemToRemove = basketModel.getItems()[itemIndex];
                            basketModel.remove(itemToRemove.id);
                            updateBasketCounter();
                        }
                    });
                });
            }

            modal.classList.add('modal_active');
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked');
            document.querySelector('.page__wrapper')?.classList.add('page__wrapper_locked');
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

function updateBasketCounter() {
    const basketCounter = document.querySelector('.header__basket-counter') as HTMLElement;
    console.log('[updateBasketCounter] Элемент найден:', !!basketCounter);
    if (basketCounter) {
        const itemCount = basketModel.getItems().length;
        console.log('[updateBasketCounter] Кол-во товаров:', itemCount);
        basketCounter.textContent = itemCount.toString();
    } else {
        console.warn('⚠️ Элемент .header__basket-counter не найден!');
    }
}


