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
            const modal = document.querySelector('.modal') as HTMLElement;
            const modalContent = modal.querySelector('.modal__content') as HTMLElement;

            // Заменяем содержимое модального окна на переданный контент (например, форму заказа или корзину)
            modalContent.replaceChildren(content);
            modal.classList.add('modal_active');
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked');

            const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
            pageWrapper?.classList.add('page__wrapper_locked');
        };

        // Функция для закрытия модального окна
        const closeModal = () => {
            const modal = document.querySelector('.modal') as HTMLElement;
            if (modal) {
                modal.classList.remove('modal_active');
                document.documentElement.classList.remove('locked');
                document.body.classList.remove('locked');

                const pageWrapper = document.querySelector('.page__wrapper') as HTMLElement;
                pageWrapper?.classList.remove('page__wrapper_locked');
            }
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

        // Обработка клика по иконке корзины (открытие корзины)
        const basketButton = document.querySelector('.header__basket') as HTMLElement;
        if (basketButton) {
            basketButton.addEventListener('click', (event: MouseEvent) => {
                console.log('Корзина открыта');

                // Получаем шаблон корзины
                const basketTemplate = document.querySelector('#basket') as HTMLTemplateElement;
                if (!basketTemplate) {
                    console.error('Шаблон корзины не найден!');
                    return;
                }

                // Клонируем и добавляем корзину в модальное окно
                const basketForm = basketTemplate.content.cloneNode(true) as DocumentFragment;
                const basketFormElement = basketForm.firstElementChild as HTMLElement;

                // Открываем модальное окно с корзиной
                openModal(basketFormElement);

                // Обработка клика по кнопке "Оформить заказ"
                const orderButton = basketFormElement.querySelector('.basket__button') as HTMLElement;
                if (orderButton) {
                    orderButton.addEventListener('click', (event: MouseEvent) => {
                        console.log('Кнопка "Оформить заказ" нажата');

                        // Получаем шаблон формы заказа
                        const orderTemplate = document.querySelector('#order') as HTMLTemplateElement;
                        if (!orderTemplate) {
                            console.error('Шаблон формы заказа не найден!');
                            return;
                        }

                        // Клонируем и добавляем форму заказа в модальное окно
                        const orderForm = orderTemplate.content.cloneNode(true) as DocumentFragment;
                        const orderFormElement = orderForm.firstElementChild as HTMLElement;

                        // Открываем модальное окно с формой заказа
                        openModal(orderFormElement);

                        // Включаем кнопку "Далее" после выбора способа оплаты
                        const paymentButtons = orderFormElement.querySelectorAll('.order__buttons button');
                        const submitButton = orderFormElement.querySelector('.order__button') as HTMLButtonElement;
                        paymentButtons.forEach(button => {
                            button.addEventListener('click', () => {
                                // Разблокируем кнопку "Далее" после выбора способа оплаты
                                submitButton.disabled = false;
                            });
                        });

                        // Обработка отправки формы
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

                            await basketModel.createOrder(orderData);
                        });
                    });
                }
            });
        }

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

        // Открытие карточки товара
        events.on('card:clicked', (product: IProduct) => {
            console.log('Карточка кликается:', product);

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
            console.log('Модалка открыта.');

            // Привязываем уникальный ID на кнопку удаления
            const removeButton = modalCardElement.querySelector('.card__remove');
            if (removeButton) {
                removeButton.setAttribute('data-id', product.id);
            }

            // Обработчик клика на кнопку добавления в корзину
            const addButton = modalCardElement.querySelector('.card__button');
            addButton?.addEventListener('click', () => {
                basketModel.add(product);
                console.log('Товар добавлен в корзину:', product);

                closeModal(); // Закрыть модальное окно после добавления товара в корзину
            });

            // Обработчик клика на кнопку удаления
            removeButton?.addEventListener('click', () => {
                const productId = removeButton.getAttribute('data-id');
                if (productId) {
                    basketModel.remove(productId);
                    console.log('Товар удален из корзины:', productId);

                    closeModal(); // Закрыть модальное окно после удаления товара
                }
            });
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});
