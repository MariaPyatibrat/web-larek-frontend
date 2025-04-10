import './scss/styles.scss';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/ShopApi';
import { ProductModel } from './components/models/ProductModel';
import { BasketModel } from './components/models/BasketModel';
import { Card } from './components/common/Card';
import { Basket } from './components/common/Basket';
import { API_URL, CDN_URL } from './utils/constants';
import { Modal } from './components/common/Modal';
import { IProduct, IOrderResult } from './types';
import { CheckoutForm } from './components/common/CheckoutForm';

const events = new EventEmitter();
const api = new ShopAPI(CDN_URL, API_URL);
const productModel = new ProductModel(events, api);
const basketModel = new BasketModel(events, api);

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Скрипт загружен и DOM готов!');

    try {
        // Модальные окна
        const modalContainers = document.querySelectorAll('.modal');
        modalContainers.forEach(container => {
            if (container instanceof HTMLElement) {
                new Modal(container);
            }
        });

        const modal = document.querySelector('.modal') as HTMLElement;
        const modalContent = modal.querySelector('.modal__content') as HTMLElement;

        const openModal = (content: HTMLElement) => {
            modalContent.replaceChildren(content);
            modal.classList.add('modal_active');
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked');

            const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
            pageWrapper?.classList.add('page__wrapper_locked');
        };

        const closeModal = () => {
            modal.classList.remove('modal_active');
            document.documentElement.classList.remove('locked');
            document.body.classList.remove('locked');

            const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
            pageWrapper?.classList.remove('page__wrapper_locked');
        };

        // Контейнер корзины
        const basketTemplate = document.querySelector('#basket');
        let basketContainer: HTMLElement | null = null;

        if (basketTemplate instanceof HTMLTemplateElement) {
            basketContainer = basketTemplate.content.firstElementChild as HTMLElement;
        } else {
            basketContainer = document.querySelector('.basket') as HTMLElement;
        }

        if (basketContainer) {
            const basketView = new Basket(basketContainer, basketModel);
            basketView.items = basketModel.getItems();
            basketView.total = basketModel.getTotal();
        }

        // Кнопка корзины
        const basketButton = document.querySelector('.header__basket') as HTMLElement;
        basketButton?.addEventListener('click', () => {
            if (!basketContainer) return;

            const clonedBasket = basketContainer.cloneNode(true) as HTMLElement;
            const basketView = new Basket(clonedBasket, basketModel);
            basketView.items = basketModel.getItems();
            basketView.total = basketModel.getTotal();

            const orderButton = clonedBasket.querySelector('.basket__button') as HTMLElement;

            orderButton?.addEventListener('click', () => {
                const orderTemplate = document.querySelector('#order') as HTMLTemplateElement;
                if (!orderTemplate) return;

                const orderFormFragment = orderTemplate.content.cloneNode(true) as DocumentFragment;
                const orderFormElement = orderFormFragment.querySelector('form') as HTMLFormElement;

                const checkout = new CheckoutForm(basketModel);
                checkout.initializeOrderForm(orderFormElement);

                // Слушаем событие успешного заказа
                const onOrderSuccess = (e: Event) => {
                    const result = (e as CustomEvent<IOrderResult>).detail;
                    document.removeEventListener('order:success', onOrderSuccess);
                    closeModal();

                    const successTemplate = document.querySelector('#success') as HTMLTemplateElement;
                    if (successTemplate) {
                        const successFragment = successTemplate.content.cloneNode(true) as DocumentFragment;
                        const successElement = successFragment.firstElementChild as HTMLElement;

                        successElement.querySelector('.order-success__description')!.textContent =
                            `Списано ${result.total} синапсов`;

                        const closeButton = successElement.querySelector('.button');
                        closeButton?.addEventListener('click', closeModal);

                        openModal(successElement);
                    }
                };

                document.addEventListener('order:success', onOrderSuccess);

                openModal(orderFormElement);
            });

            openModal(clonedBasket);
        });

        // Загрузка товаров
        events.on('products:loaded', (products: IProduct[]) => {
            const gallery = document.querySelector('.gallery');
            const cardTemplate = document.querySelector('#card-catalog') as HTMLTemplateElement;
            if (!gallery || !cardTemplate) return;

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

                gallery.appendChild(cardElement);
            });
        });

        await productModel.load();

        // Изменения в корзине
        events.on('basket:changed', (items: IProduct[]) => {
            const basket = new Basket(basketContainer, basketModel);
            basket.items = items.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price
            }));
            basket.total = basketModel.getTotal();
        });

        // Клик по карточке
        events.on('card:clicked', (product: IProduct) => {
            const template = document.querySelector('#card-preview') as HTMLTemplateElement;
            if (!template) return;

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
            if (textElement) {
                textElement.textContent = product.description;
            }

            const addButton = modalCardElement.querySelector('.card__button');
            const removeButton = modalCardElement.querySelector('.card__remove');

            addButton?.addEventListener('click', () => {
                basketModel.add(product);
                closeModal();
            });

            removeButton?.addEventListener('click', () => {
                basketModel.remove(product.id);
                closeModal();
            });

            openModal(modalCardElement);
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});
