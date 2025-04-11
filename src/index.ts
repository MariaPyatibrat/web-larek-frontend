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
        const modalContainers = document.querySelectorAll('.modal');
        modalContainers.forEach(container => {
            if (container instanceof HTMLElement) {
                new Modal(container);
            }
        });

        const modal = document.querySelector('.modal') as HTMLElement | null;
        if (!modal) throw new Error('Modal container not found');

        const modalContent = modal.querySelector('.modal__content') as HTMLElement | null;
        if (!modalContent) throw new Error('Modal content not found');

        const openModal = (content: HTMLElement) => {
            modalContent.replaceChildren(content);
            modal.classList.add('modal_active');
            document.documentElement.classList.add('locked');
            document.body.classList.add('locked');

            const pageWrapper = document.querySelector('.page__wrapper');
            if (pageWrapper instanceof HTMLElement) {
                pageWrapper.classList.add('page__wrapper_locked');
            }
        };

        const closeModal = () => {
            modal.classList.remove('modal_active');
            document.documentElement.classList.remove('locked');
            document.body.classList.remove('locked');

            const pageWrapper = document.querySelector('.page__wrapper');
            if (pageWrapper instanceof HTMLElement) {
                pageWrapper.classList.remove('page__wrapper_locked');
            }
        };

        const basketTemplate = document.querySelector('#basket') as HTMLTemplateElement | null;
        let basketContainer: HTMLElement | null = null;

        if (basketTemplate) {
            basketContainer = basketTemplate.content.querySelector('.basket') as HTMLElement | null;
        } else {
            basketContainer = document.querySelector('.basket') as HTMLElement | null;
        }

        if (!basketContainer) throw new Error('Basket container not found');

        const basketView = new Basket(basketContainer, basketModel);
        basketView.items = basketModel.getItems();
        basketView.total = basketModel.getTotal();

        const basketButton = document.querySelector('.header__basket');
        basketButton?.addEventListener('click', () => {
            if (!basketContainer) return;

            const clonedBasket = basketContainer.cloneNode(true) as HTMLElement;
            const basketView = new Basket(clonedBasket, basketModel);
            basketView.items = basketModel.getItems();
            basketView.total = basketModel.getTotal();

            const orderButton = clonedBasket.querySelector('.basket__button');
            orderButton?.addEventListener('click', () => {
                const orderTemplate = document.querySelector('#order') as HTMLTemplateElement | null;
                if (!orderTemplate) return;

                const orderFormFragment = orderTemplate.content.cloneNode(true) as DocumentFragment;
                const orderFormElement = orderFormFragment.querySelector('form') as HTMLFormElement | null;
                if (!orderFormElement) return;

                const checkout = new CheckoutForm(basketModel);
                checkout.initializeOrderForm(orderFormElement);

                const nextButton = orderFormElement.querySelector('.order__button');
                nextButton?.addEventListener('click', () => {
                    const contactsTemplate = document.querySelector('#contacts') as HTMLTemplateElement | null;
                    if (!contactsTemplate) return;

                    const contactsFormFragment = contactsTemplate.content.cloneNode(true) as DocumentFragment;
                    const contactsFormElement = contactsFormFragment.querySelector('form') as HTMLFormElement | null;
                    if (!contactsFormElement) return;

                    const emailInput = contactsFormElement.querySelector('input[name="email"]') as HTMLInputElement | null;
                    const phoneInput = contactsFormElement.querySelector('input[name="phone"]') as HTMLInputElement | null;
                    const errorSpan = contactsFormElement.querySelector('.form__errors') as HTMLElement | null;
                    const submitButton = contactsFormElement.querySelector('button[type="submit"]') as HTMLButtonElement | null;

                    if (!emailInput || !phoneInput || !errorSpan || !submitButton) return;

                    const validateContactsForm = () => {
                        const email = emailInput.value;
                        const phone = phoneInput.value;
                        const errors: string[] = [];

                        const emailError = ValidationService.validateEmail(email);
                        if (emailError) errors.push(emailError);

                        const phoneError = ValidationService.validatePhone(phone);
                        if (phoneError) errors.push(phoneError);

                        errorSpan.textContent = errors.join('\n');
                        submitButton.disabled = errors.length > 0;
                    };

                    emailInput.addEventListener('input', validateContactsForm);
                    phoneInput.addEventListener('input', validateContactsForm);
                    emailInput.addEventListener('blur', validateContactsForm);
                    phoneInput.addEventListener('blur', validateContactsForm);

                    validateContactsForm();
                    openModal(contactsFormElement);

                    contactsFormElement.addEventListener('submit', async (submitEvent) => {
                        submitEvent.preventDefault();

                        const email = emailInput.value;
                        const phone = phoneInput.value;
                        const orderData = basketModel.getOrderData();
                        const errors: string[] = [];

                        if (!orderData.address) errors.push('Адрес не указан');
                        if (!orderData.payment) errors.push('Способ оплаты не выбран');

                        const emailError = ValidationService.validateEmail(email);
                        if (emailError) errors.push(emailError);

                        const phoneError = ValidationService.validatePhone(phone);
                        if (phoneError) errors.push(phoneError);

                        if (errors.length > 0) {
                            errorSpan.textContent = errors.join('\n');
                            return;
                        }

                        try {
                            const result = await api.createOrder({
                                email,
                                phone,
                                address: orderData.address,
                                payment: orderData.payment,
                                items: basketModel.getItems().map(item => item.id),
                                total: basketModel.getTotal()
                            });

                            const successTemplate = document.querySelector('#success') as HTMLTemplateElement | null;
                            if (successTemplate) {
                                const successContent = successTemplate.content.cloneNode(true) as DocumentFragment;
                                const successElement = successContent.querySelector('.order-success') as HTMLElement | null;

                                if (successElement) {
                                    const description = successElement.querySelector('.order-success__description');
                                    if (description) {
                                        description.textContent = `Списано ${result.total} синапсов`;
                                    }

                                    successElement.querySelector('.button')?.addEventListener('click', () => {
                                        closeModal();
                                        basketModel.clear();
                                    });

                                    openModal(successElement);
                                }
                            }
                        } catch (error) {
                            console.error('Ошибка заказа:', error);
                            errorSpan.textContent = 'Ошибка при оформлении заказа. Попробуйте ещё раз.';
                        }
                    });
                });

                openModal(orderFormElement);
            });

            openModal(clonedBasket);
        });

        events.on('products:loaded', (products: IProduct[]) => {
            const gallery = document.querySelector('.gallery') as HTMLElement | null;
            const cardTemplate = document.querySelector('#card-catalog') as HTMLTemplateElement | null;

            if (!gallery || !cardTemplate) return;

            gallery.innerHTML = '';
            products.forEach(product => {
                const fragment = cardTemplate.content.cloneNode(true) as DocumentFragment;
                const cardElement = fragment.querySelector('.card') as HTMLElement | null;
                if (!cardElement) return;

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

        events.on('card:clicked', (product: IProduct) => {
            const template = document.querySelector('#card-preview') as HTMLTemplateElement | null;
            if (!template) return;

            const fragment = template.content.cloneNode(true) as DocumentFragment;
            const modalCardElement = fragment.querySelector('.card') as HTMLElement | null;
            if (!modalCardElement) return;

            const modalCard = new Card(modalCardElement);
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

            openModal(modalCardElement);
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});
