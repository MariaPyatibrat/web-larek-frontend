import { IProduct } from '../types';
import { EventEmitter } from './base/events';
import { Card } from './common/Card';

export class MainPageView {
    constructor(
        private gallery: HTMLElement,
        private basketButton: HTMLElement,
        private basketCounter: HTMLElement,
        private events: EventEmitter
    ) {
        this.initTemplate();
    }

    private cardTemplate: HTMLTemplateElement;

    private initTemplate() {
        const template = document.querySelector('#card-catalog');
        if (!(template instanceof HTMLTemplateElement)) {
            throw new Error('Card template not found');
        }
        this.cardTemplate = template;
    }

    set products(items: IProduct[]) {
        const cards = items.map(product => this.createCard(product));
        this.gallery.replaceChildren(...cards);
    }

    set counter(value: number) {
        this.basketCounter.textContent = String(value);
        this.basketCounter.classList.toggle('header__basket-counter_hidden', value === 0);
    }

    onBasketClick(callback: () => void) {
        this.basketButton.addEventListener('click', callback);
    }

    private createCard(product: IProduct): HTMLElement {
        const fragment = this.cardTemplate.content.cloneNode(true) as DocumentFragment;
        const cardElement = fragment.querySelector('.card');
        if (!cardElement) throw new Error('Card element not found');

        const card = new Card(cardElement as HTMLElement);
        card.update({
            id: product.id,
            title: product.title,
            price: `${product.price} синапсов`,
            category: product.category,
            image: product.image
        });

        cardElement.addEventListener('click', () => {
            this.events.emit('card:clicked', product);
        });

        return cardElement as HTMLElement;
    }
}