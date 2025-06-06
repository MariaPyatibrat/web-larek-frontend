import { Component } from '../base/Component';

export interface IModalData {
    content: HTMLElement;
}

export class Modal extends Component<IModalData> {
    protected _closeButton: HTMLButtonElement;
    protected _content: HTMLElement;

    constructor(container: HTMLElement) {
        super(container);

        this._closeButton = this.ensureElement<HTMLButtonElement>('.modal__close');
        this._content = this.ensureElement<HTMLElement>('.modal__content');

        this._closeButton.addEventListener('click', this.close.bind(this));
        this.container.addEventListener('click', this.close.bind(this));
        this._content.addEventListener('click', (event) => event.stopPropagation());
    }

    protected ensureElement<T extends HTMLElement = HTMLElement>(selector: string): T {
        const element = this.container.querySelector(selector);
        if (!element) {
            throw new Error(`Не найден элемент по селектору: ${selector}`);
        }
        return element as T;
    }

    set content(value: HTMLElement) {
        this._content.replaceChildren(value);
    }

    open() {
        this.container.classList.add('modal_active');
        document.documentElement.classList.add('locked');
        document.body.classList.add('locked');

        const wrapper = document.querySelector('.page__wrapper');
        if (wrapper instanceof HTMLElement) {
            wrapper.classList.add('page__wrapper_locked');
        }
    }

    close() {
        this.container.classList.remove('modal_active');
        document.documentElement.classList.remove('locked');
        document.body.classList.remove('locked');

        const wrapper = document.querySelector('.page__wrapper');
        if (wrapper instanceof HTMLElement) {
            wrapper.classList.remove('page__wrapper_locked');
        }
    }
}
