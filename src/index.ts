import './scss/styles.scss';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/ShopApi';
import { ProductModel } from './components/models/ProductModel';
import { BasketModel } from './components/models/BasketModel';
import { Card } from './components/common/Card';
import { Basket } from './components/common/Basket';
import { API_URL, CDN_URL } from './utils/constants';
import { Modal } from './components/common/Modal';
import { IProduct, IOrder, IOrderResult } from './types';

const events = new EventEmitter();
const api = new ShopAPI(CDN_URL, API_URL);
const productModel = new ProductModel(events, api);
const basketModel = new BasketModel(events, api);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализация модальных окон
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

        // Инициализация контейнера корзины
        const basketTemplate = document.querySelector('#basket');
        let basketContainer: HTMLElement | null = null;

        if (basketTemplate instanceof HTMLTemplateElement) {
            basketContainer = basketTemplate.content.firstElementChild as HTMLElement;
        } else {
            basketContainer = document.querySelector('.basket') as HTMLElement;
        }

        if (basketContainer) {
            new Basket(basketContainer, basketModel);  // Передаем basketModel в корзину
        }

        // Обработка клика по иконке корзины
        const basketButton = document.querySelector('.header__basket') as HTMLElement;
        basketButton?.addEventListener('click', () => {
            if (!basketContainer) return;

            const clonedBasket = basketContainer.cloneNode(true) as HTMLElement;
            new Basket(clonedBasket, basketModel); // Инициализируем корзину с моделью

            openModal(clonedBasket);
        });

        // Подписка на products:loaded
        events.on('products:loaded', (products: IProduct[]) => {
            const gallery = document.querySelector('.gallery');
            if (!gallery) {
                console.error('Галерея не найдена!');
                return;
            }

            const cardTemplate = document.querySelector('#card-catalog') as HTMLTemplateElement;
            if (!cardTemplate) {
                console.error('Шаблон карточки не найден!');
                return;
            }

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

        // Обработка изменений в корзине
        events.on('basket:changed', (items: IProduct[]) => {
            // Обновляем UI корзины
            const basket = new Basket(basketContainer as HTMLElement, basketModel);
            basket.items = items.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price
            }));
            basket.total = basketModel.getTotal();

            const basketCounter = document.querySelector('.header__basket-counter') as HTMLElement;
            if (basketCounter) {
                basketCounter.textContent = items.length.toString();
            }
        });

        // Обработка оформления заказа
        const orderForm = document.querySelector('.order') as HTMLFormElement;
        orderForm?.addEventListener('submit', async (e) => {
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

        // Обработка успешного заказа
        events.on<IOrderResult>('order:completed', (result) => {
            const successModal = document.querySelector('.modal_success') as HTMLElement;
            if (successModal) {
                successModal.querySelector('.order-success__description')!.textContent =
                    `Списано ${result.total} синапсов`;
                successModal.style.display = 'flex';
            }
        });


        // При клике на карточку товара
        events.on('card:clicked', (product: IProduct) => {
            const template = document.querySelector('#card-preview') as HTMLTemplateElement;
            if (!template) {
                console.error('Шаблон предпросмотра карточки не найден!');
                return;
            }

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

            // Открываем модалку
            openModal(modalCardElement);

            // Привязываем уникальный ID на кнопку удаления
            const removeButton = modalCardElement.querySelector('.card__remove'); // Кнопка удаления
            if (removeButton) {
                removeButton.setAttribute('data-id', product.id); // Уникальный атрибут для каждой карточки
            }

            // Обработчик клика на кнопку добавления в корзину
            const addButton = modalCardElement.querySelector('.card__button');
            addButton?.addEventListener('click', () => {
                basketModel.add(product);

                modal.classList.remove('modal_active');
                document.documentElement.classList.remove('locked');
                document.body.classList.remove('locked');
                const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
                pageWrapper?.classList.remove('page__wrapper_locked');
            });

            // Обработчик клика на кнопку удаления
            removeButton?.addEventListener('click', () => {
                const productId = removeButton.getAttribute('data-id');
                if (productId) {
                    basketModel.remove(productId);  // Теперь можно вызвать метод remove
                    modal.classList.remove('modal_active');
                    document.documentElement.classList.remove('locked');
                    document.body.classList.remove('locked');
                    const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
                    pageWrapper?.classList.remove('page__wrapper_locked');
                }
            });
        });


        // Обработка события удаления товара из корзины
        events.on('basket:itemRemoved', (e: CustomEvent) => {
            const itemId = e.detail;
            basketModel.handleItemRemoval(itemId); // Используем handleItemRemoval из модели
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});