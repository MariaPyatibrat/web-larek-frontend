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

        const closeModal = () => {
            modal.classList.remove('modal_active');
            document.documentElement.classList.remove('locked');
            document.body.classList.remove('locked');

            const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
            pageWrapper?.classList.remove('page__wrapper_locked');
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
            const basketView = new Basket(basketContainer, basketModel);
            basketView.items = basketModel.getItems();
            basketView.total = basketModel.getTotal();
        }

        // Обработка клика по иконке корзины
        const basketButton = document.querySelector('.header__basket') as HTMLElement;
        basketButton?.addEventListener('click', () => {
            if (!basketContainer) return;

            const clonedBasket = basketContainer.cloneNode(true) as HTMLElement;
            const basketView = new Basket(clonedBasket, basketModel);
            basketView.items = basketModel.getItems();
            basketView.total = basketModel.getTotal();

            // Обработка кнопки "Оформить заказ" в корзине
            const orderButton = clonedBasket.querySelector('.basket__button');
            orderButton?.addEventListener('click', () => {
                const orderTemplate = document.querySelector('#order') as HTMLTemplateElement;
                if (!orderTemplate) return;

                const orderForm = orderTemplate.content.cloneNode(true) as DocumentFragment;
                const orderFormElement = orderForm.firstElementChild as HTMLElement;

                // Инициализация формы заказа
                const paymentButtons = orderFormElement.querySelectorAll('.order__buttons button');
                const submitButton = orderFormElement.querySelector('.order__button') as HTMLButtonElement;
                submitButton.disabled = true;

                paymentButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        paymentButtons.forEach(btn => btn.classList.remove('button_alt-active'));
                        button.classList.add('button_alt-active');
                        submitButton.disabled = false;
                    });
                });

                // Обработка отправки формы заказа
                orderFormElement.querySelector('form')?.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const formData = new FormData(e.target as HTMLFormElement);
                    const orderData: IOrder = {
                        payment: formData.get('payment') as 'online' | 'offline',
                        address: formData.get('address') as string,
                        email: formData.get('email') as string,
                        phone: formData.get('phone') as string,
                        items: basketModel.getItems().map(item => item.id),
                        total: basketModel.getTotal()
                    };

                    try {
                        const result = await basketModel.createOrder(orderData);
                        closeModal();

                        // Показываем окно успешного заказа
                        const successTemplate = document.querySelector('#success') as HTMLTemplateElement;
                        if (successTemplate) {
                            const successModal = successTemplate.content.cloneNode(true) as DocumentFragment;
                            const successElement = successModal.firstElementChild as HTMLElement;

                            successElement.querySelector('.order-success__description')!.textContent =
                                `Списано ${result.total} синапсов`;

                            const closeButton = successElement.querySelector('.button');
                            closeButton?.addEventListener('click', closeModal);

                            openModal(successElement);
                        }
                    } catch (error) {
                        console.error('Ошибка оформления заказа:', error);
                        alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте ещё раз.');
                    }
                });

                openModal(orderFormElement);
            });

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
            if (basketContainer) {
                const basket = new Basket(basketContainer, basketModel);
                basket.items = items.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price
                }));
                basket.total = basketModel.getTotal();
            }

            // Обновляем счетчик в шапке
            const basketCounter = document.querySelector('.header__basket-counter') as HTMLElement;
            if (basketCounter) {
                basketCounter.textContent = items.length.toString();
            }
        });

        // Обработка клика по карточке товара
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

            // Обработка кнопок в модальном окне товара
            const addButton = modalCardElement.querySelector('.card__button');
            const removeButton = modalCardElement.querySelector('.card__remove');

            if (addButton) {
                addButton.addEventListener('click', () => {
                    basketModel.add(product);
                    closeModal();
                });
            }

            if (removeButton) {
                removeButton.setAttribute('data-id', product.id);
                removeButton.addEventListener('click', () => {
                    basketModel.remove(product.id);
                    closeModal();
                });
            }
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

        // Обработка события удаления товара из корзины
        events.on('basket:itemRemoved', (e: CustomEvent) => {
            const itemId = e.detail;
            basketModel.handleItemRemoval(itemId);
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});