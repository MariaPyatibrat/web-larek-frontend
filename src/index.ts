import './scss/styles.scss';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/ShopApi';
import { ProductModel } from './components/models/ProductModel';
import { BasketModel } from './components/models/BasketModel';
import { Card } from './components/common/Card';
import { Basket } from './components/common/Basket';
import { API_URL, CDN_URL } from './utils/constants';
import { Modal } from './components/common/Modal';
import { IProduct, IOrderResult, IOrder } from './types';
import { CheckoutForm } from './components/common/CheckoutForm';
import { ValidationService } from './components/common/ValidationService';

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

        const modal = document.querySelector('.modal');
        if (!modal || !(modal instanceof HTMLElement)) {
            throw new Error('Modal container not found or not HTMLElement');
        }

        const modalContent = modal.querySelector('.modal__content');
        if (!modalContent || !(modalContent instanceof HTMLElement)) {
            throw new Error('Modal content not found or not HTMLElement');
        }

        const openModal = (content: HTMLElement) => {
            if (!(modal instanceof HTMLElement)) return;
            if (!(modalContent instanceof HTMLElement)) return;

            modalContent.replaceChildren(content);
            modal.classList.add('modal_active');
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked');

            const pageWrapper = document.querySelector('.page__wrapper');
            if (pageWrapper) {
                pageWrapper.classList.add('page__wrapper_locked');
            }
        };

        const closeModal = () => {
            if (!(modal instanceof HTMLElement)) return;

            modal.classList.remove('modal_active');
            document.documentElement.classList.remove('locked');
            document.body.classList.remove('locked');

            const pageWrapper = document.querySelector('.page__wrapper');
            if (pageWrapper) {
                pageWrapper.classList.remove('page__wrapper_locked');
            }
        };

        // Контейнер корзины
        const basketTemplate = document.querySelector('#basket');
        let basketContainer: HTMLElement | null = null;

        if (basketTemplate instanceof HTMLTemplateElement) {
            basketContainer = basketTemplate.content.querySelector('.basket');
        } else {
            basketContainer = document.querySelector('.basket');
        }

        if (!basketContainer) throw new Error('Basket container not found');

        const basketView = new Basket(basketContainer, basketModel);
        basketView.items = basketModel.getItems();
        basketView.total = basketModel.getTotal();

        // Кнопка корзины
        const basketButton = document.querySelector('.header__basket');
        basketButton?.addEventListener('click', () => {
            if (!basketContainer) return;

            const clonedBasket = basketContainer.cloneNode(true) as HTMLElement;
            const basketView = new Basket(clonedBasket, basketModel);
            basketView.items = basketModel.getItems();
            basketView.total = basketModel.getTotal();

            const orderButton = clonedBasket.querySelector('.basket__button');
            orderButton?.addEventListener('click', () => {
                const orderTemplate = document.querySelector('#order');
                if (!(orderTemplate instanceof HTMLTemplateElement)) return;

                const orderFormFragment = orderTemplate.content.cloneNode(true) as DocumentFragment;
                const orderFormElement = orderFormFragment.querySelector('form');
                if (!orderFormElement) return;

                const checkout = new CheckoutForm(basketModel);
                checkout.initializeOrderForm(orderFormElement as HTMLFormElement);

                const nextButton = orderFormElement.querySelector('.order__button');
                nextButton?.addEventListener('click', () => {
                    const contactsTemplate = document.querySelector('#contacts');
                    if (!(contactsTemplate instanceof HTMLTemplateElement)) return;

                    const contactsFormFragment = contactsTemplate.content.cloneNode(true) as DocumentFragment;
                    const contactsFormElement = contactsFormFragment.querySelector('form');
                    if (!contactsFormElement) return;

                    // Добавляем валидацию для формы контактов
                    const emailInput = contactsFormElement.querySelector('input[name="email"]');
                    const phoneInput = contactsFormElement.querySelector('input[name="phone"]');
                    const errorSpan = contactsFormElement.querySelector('.form__errors');
                    const submitButton = contactsFormElement.querySelector('button[type="submit"]');

                    const validateContactsForm = () => {
                        if (!emailInput || !phoneInput || !errorSpan || !submitButton) return;

                        const email = (emailInput as HTMLInputElement).value;
                        const phone = (phoneInput as HTMLInputElement).value;

                        const errors: string[] = [];

                        const emailError = ValidationService.validateEmail(email);
                        if (emailError) errors.push(emailError);

                        const phoneError = ValidationService.validatePhone(phone);
                        if (phoneError) errors.push(phoneError);

                        errorSpan.textContent = errors.join('\n');
                        (submitButton as HTMLButtonElement).disabled = errors.length > 0;
                    };

                    emailInput?.addEventListener('input', validateContactsForm);
                    phoneInput?.addEventListener('input', validateContactsForm);
                    emailInput?.addEventListener('blur', validateContactsForm);
                    phoneInput?.addEventListener('blur', validateContactsForm);

                    // Изначальная валидация
                    validateContactsForm();

                    openModal(contactsFormElement as HTMLElement);

                    const handleSubmit = async (submitEvent: SubmitEvent) => {
                        submitEvent.preventDefault();

                        const email = (emailInput as HTMLInputElement)?.value;
                        const phone = (phoneInput as HTMLInputElement)?.value;

                        // Финальная проверка перед отправкой
                        const errors: string[] = [];

                        const emailError = ValidationService.validateEmail(email);
                        if (emailError) errors.push(emailError);

                        const phoneError = ValidationService.validatePhone(phone);
                        if (phoneError) errors.push(phoneError);

                        if (errors.length > 0) {
                            errorSpan.textContent = errors.join('\n');
                            return;
                        }

                        // Получаем данные из формы заказа
                        const orderForm = document.querySelector('.order__form form');
                        const address = orderForm?.querySelector('input[name="address"]') as HTMLInputElement;
                        const paymentMethod = orderForm?.querySelector('.button_alt-active')?.getAttribute('name');

                        const orderData: IOrder = {
                            email,
                            phone,
                            items: basketModel.getItems().map(item => item.id),
                            total: basketModel.getTotal(),
                            payment: paymentMethod === 'card' ? 'online' : 'offline',
                            address: address?.value || '',
                        };

                        try {
                            const result = await api.createOrder(orderData);

                            const successTemplate = document.querySelector('#success');
                            if (successTemplate instanceof HTMLTemplateElement) {
                                const successFragment = successTemplate.content.cloneNode(true) as DocumentFragment;
                                const successElement = successFragment.querySelector('.order-success');
                                if (!successElement) return;

                                const description = successElement.querySelector('.order-success__description');
                                if (description) {
                                    description.textContent = `Списано ${result.total} синапсов`;
                                }

                                const closeButton = successElement.querySelector('.button');
                                closeButton?.addEventListener('click', () => {
                                    closeModal();
                                    basketModel.clear(); // Очищаем корзину после успешного заказа
                                });

                                openModal(successElement as HTMLElement);
                            }
                        } catch (error) {
                            console.error('Ошибка отправки заказа:', error);
                            errorSpan.textContent = 'Произошла ошибка при отправке заказа. Попробуйте еще раз.';
                        }
                    };

                    contactsFormElement.addEventListener('submit', handleSubmit);
                });

                openModal(orderFormElement as HTMLElement);
            });

            openModal(clonedBasket);
        });

        // Загрузка товаров
        events.on('products:loaded', (products: IProduct[]) => {
            const gallery = document.querySelector('.gallery');
            const cardTemplate = document.querySelector('#card-catalog');

            if (!gallery || !(cardTemplate instanceof HTMLTemplateElement)) return;

            gallery.innerHTML = '';
            products.forEach(product => {
                const fragment = cardTemplate.content.cloneNode(true) as DocumentFragment;
                const cardElement = fragment.querySelector('.card');
                if (!cardElement) return;

                const card = new Card(cardElement as HTMLElement);
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
            if (!basketContainer) return;

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
            const template = document.querySelector('#card-preview');
            if (!(template instanceof HTMLTemplateElement)) return;

            const fragment = template.content.cloneNode(true) as DocumentFragment;
            const modalCardElement = fragment.querySelector('.card');
            if (!modalCardElement) return;

            const modalCard = new Card(modalCardElement as HTMLElement);
            modalCard.update({
                id: product.id,
                title: product.title,
                price: `${product.price} синапсов`,
                category: product.category,
                image: product.image
            });

            const textElement = modalCardElement.querySelector('.card__text');
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

            openModal(modalCardElement as HTMLElement);
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});