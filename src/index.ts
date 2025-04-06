import './scss/styles.scss';
import { EventEmitter } from './components/base/events';
import { ShopAPI } from './components/ShopApi';
import { ProductModel } from './components/models/ProductModel';
import { BasketModel } from './components/models/BasketModel';
import { Card } from './components/common/Card';
import { Basket } from './components/common/Basket';
import { API_URL, CDN_URL } from "./utils/constants";
import { Modal } from './components/common/Modal';

// Инициализация
const events = new EventEmitter();
const api = new ShopAPI(CDN_URL, API_URL);
const productModel = new ProductModel(events);
const basketModel = new BasketModel(events);

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Модальные окна
        const modalContainers = document.querySelectorAll('.modal');
        modalContainers.forEach(container => {
            if (container instanceof HTMLElement) {
                new Modal(container);
            }
        });

        // Корзина
        const basketTemplate = document.querySelector('#basket');
        let basketContainer: HTMLElement | null = null;

        if (basketTemplate instanceof HTMLTemplateElement) {
            basketContainer = basketTemplate.content.firstElementChild as HTMLElement;
        } else {
            basketContainer = document.querySelector('.basket') as HTMLElement;
        }

        if (basketContainer) {
            new Basket(basketContainer);
        }

        // Карточка
        const cardTemplate = document.querySelector('#card-catalog');
        if (cardTemplate instanceof HTMLTemplateElement) {
            const cardElement = cardTemplate.content.firstElementChild as HTMLElement;
            new Card(cardElement);
        }

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});
