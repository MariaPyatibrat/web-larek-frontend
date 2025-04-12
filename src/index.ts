import './scss/styles.scss';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/ShopApi';
import { ProductModel } from './components/models/ProductModel';
import { BasketModel } from './components/models/BasketModel';
import { API_URL, CDN_URL } from './utils/constants';
import { IProduct } from './types';
import { CheckoutForm } from './components/common/CheckoutForm';
import { ValidationService } from './components/common/ValidationService';
import { MainPageView } from './components/MainPageView';
import { Basket } from './components/common/Basket';
import { Card } from './components/common/Card';

interface ContactsOrderData {
    address: string;
    payment: 'online' | 'offline';
    email?: string;
    phone?: string;
}

const events = new EventEmitter();
const api = new ShopAPI(CDN_URL, API_URL);
const productModel = new ProductModel(events, api);
const basketModel = new BasketModel(events, api);

document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация основных элементов
    const modal = document.querySelector('.modal');
    if (!modal) throw new Error('Modal element not found');

    const modalContent = modal.querySelector('.modal__content');
    if (!modalContent) throw new Error('Modal content not found');

    const modalCloseButton = modal.querySelector('.modal__close');
    if (!modalCloseButton) throw new Error('Modal close button not found');

    const mainView = new MainPageView(
        document.querySelector('.gallery') as HTMLElement,
        document.querySelector('.header__basket') as HTMLElement,
        document.querySelector('.header__basket-counter') as HTMLElement,
        events
    );

    // Функции работы с модальными окнами
    const openModal = (content: HTMLElement) => {
        (modalContent as HTMLElement).replaceChildren(content);
        (modal as HTMLElement).classList.add('modal_active');
        document.documentElement.classList.add('locked');
        document.body.classList.add('locked');
        document.querySelector('.page__wrapper')?.classList.add('page__wrapper_locked');
    };

    const closeModal = () => {
        (modal as HTMLElement).classList.remove('modal_active');
        document.documentElement.classList.remove('locked');
        document.body.classList.remove('locked');
        document.querySelector('.page__wrapper')?.classList.remove('page__wrapper_locked');
    };

    (modalCloseButton as HTMLElement).addEventListener('click', closeModal);

    // Обработчик клика по корзине
    mainView.onBasketClick(() => {
        const basketTemplate = document.querySelector('#basket') as HTMLTemplateElement;
        const basketElement = basketTemplate.content.querySelector('.basket')?.cloneNode(true) as HTMLElement;
        if (!basketElement) throw new Error('Basket element not found');

        const basketView = new Basket(basketElement, basketModel);
        basketView.items = basketModel.getItems();
        basketView.total = basketModel.getTotal();

        const closeButton = basketElement.querySelector('.basket__close') as HTMLElement;
        closeButton?.addEventListener('click', closeModal);

        const orderButton = basketElement.querySelector('.basket__button') as HTMLButtonElement;
        orderButton?.addEventListener('click', () => {
            const orderTemplate = document.querySelector('#order') as HTMLTemplateElement;
            const orderFormElement = orderTemplate.content.querySelector('form')?.cloneNode(true) as HTMLFormElement;
            if (!orderFormElement) throw new Error('Order form not found');

            const checkout = new CheckoutForm(basketModel);
            checkout.initializeOrderForm(orderFormElement);

            const nextButton = orderFormElement.querySelector('.order__button') as HTMLButtonElement;
            nextButton?.addEventListener('click', () => {
                const orderData = basketModel.getOrderData();

                if (!orderData.address || !orderData.payment) {
                    const errorContainer = orderFormElement.querySelector('.form__errors') as HTMLElement;
                    if (errorContainer) {
                        errorContainer.textContent = [
                            !orderData.address ? 'Необходимо указать адрес' : '',
                            !orderData.payment ? 'Выберите способ оплаты' : ''
                        ].filter(Boolean).join('\n');
                    }
                    return;
                }

                initContactsForm({
                    address: orderData.address,
                    payment: orderData.payment
                });
            });

            openModal(orderFormElement);
        });

        openModal(basketElement);
    });

    // Инициализация формы контактов
    const initContactsForm = (orderData: ContactsOrderData) => {
        const contactsTemplate = document.querySelector('#contacts') as HTMLTemplateElement;
        const contactsForm = contactsTemplate.content.querySelector('form')?.cloneNode(true) as HTMLFormElement;
        if (!contactsForm) throw new Error('Contacts form not found');

        const emailInput = contactsForm.querySelector('input[name="email"]') as HTMLInputElement;
        const phoneInput = contactsForm.querySelector('input[name="phone"]') as HTMLInputElement;
        const errorSpan = contactsForm.querySelector('.form__errors') as HTMLElement;
        const submitButton = contactsForm.querySelector('button[type="submit"]') as HTMLButtonElement;

        submitButton.disabled = true;
        if (orderData.email) emailInput.value = orderData.email;
        if (orderData.phone) phoneInput.value = orderData.phone;

        const validateContacts = () => {
            const errors = [
                ValidationService.validateEmail(emailInput.value),
                ValidationService.validatePhone(phoneInput.value)
            ].filter(Boolean) as string[];

            errorSpan.textContent = errors.join('\n');
            submitButton.disabled = errors.length > 0;
        };

        validateContacts();
        [emailInput, phoneInput].forEach(input => {
            input.addEventListener('input', validateContacts);
            input.addEventListener('blur', validateContacts);
        });

        contactsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const items = basketModel.getItems();
                const total = basketModel.getTotal();

                // Очищаем корзину перед отправкой заказа
                basketModel.clear();

                const result = await api.createOrder({
                    email: emailInput.value,
                    phone: phoneInput.value,
                    address: orderData.address,
                    payment: orderData.payment,
                    items: items.map(i => i.id),
                    total: total
                });

                const successTemplate = document.querySelector('#success') as HTMLTemplateElement;
                const successElement = successTemplate.content.querySelector('.order-success')?.cloneNode(true) as HTMLElement;
                if (!successElement) throw new Error('Success element not found');

                const description = successElement.querySelector('.order-success__description') as HTMLElement;
                if (description) {
                    description.textContent = `Списано ${result.total} синапсов`;
                }

                successElement.querySelector('.button')?.addEventListener('click', closeModal);
                openModal(successElement);
            } catch (error) {
                errorSpan.textContent = 'Ошибка при оформлении заказа. Попробуйте ещё раз.';
                console.error(error);
            }
        });

        openModal(contactsForm);
    };

    // Обработчики событий
    events.on('products:loaded', (products: IProduct[]) => {
        mainView.products = products;
    });

    events.on('card:clicked', (product: IProduct) => {
        const template = document.querySelector('#card-preview') as HTMLTemplateElement;
        const cardElement = template.content.querySelector('.card')?.cloneNode(true) as HTMLElement;
        if (!cardElement) throw new Error('Card element not found');

        const modalCard = new Card(cardElement);
        modalCard.update({
            id: product.id,
            title: product.title,
            price: `${product.price} синапсов`,
            category: product.category,
            image: product.image
        });

        const text = cardElement.querySelector('.card__text') as HTMLElement;
        if (text) text.textContent = product.description;

        const addButton = cardElement.querySelector('.card__button') as HTMLButtonElement;
        const removeButton = cardElement.querySelector('.card__remove') as HTMLButtonElement;

        addButton?.addEventListener('click', () => {
            basketModel.add(product);
            closeModal();
        });

        removeButton?.addEventListener('click', () => {
            basketModel.remove(product.id);
            closeModal();
        });

        openModal(cardElement);
    });

    events.on('basket:changed', (items: IProduct[]) => {
        mainView.counter = items.length;
    });

    // Загрузка продуктов
    try {
        await productModel.load();
    } catch (error) {
        console.error('Failed to load products:', error);
    }
});