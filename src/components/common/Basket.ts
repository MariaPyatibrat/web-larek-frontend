import { Component } from '../base/Component';
import { ensureElement } from '../../utils/utils';

interface IBasketData {
    items: HTMLElement[];
    total: number;
}

export class Basket extends Component<IBasketData> {
    protected _list: HTMLElement;
    protected _total: HTMLElement;
    protected _button: HTMLButtonElement;

    constructor(container: HTMLElement) {
        super(container);

        this._list = ensureElement<HTMLElement>('.basket__list', container);
        this._total = ensureElement<HTMLElement>('.basket__price', container);
        this._button = container.querySelector('.basket__button, .button') as HTMLButtonElement;
    }

    set items(items: HTMLElement[]) {
        this._list.replaceChildren(...items);
    }

    set total(value: number) {
        this.setText(this._total, `${value} синапсов`);
    }
}