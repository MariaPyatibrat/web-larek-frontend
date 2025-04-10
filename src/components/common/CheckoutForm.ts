import { ValidationService } from './ValidationService';
import { BasketModel } from '../models/BasketModel';
import { IOrder } from '../../types';

export class CheckoutForm {
    private basketModel: BasketModel;
    private formElement: HTMLFormElement | null = null;
    private errorsContainer: HTMLElement | null = null;
    private submitButton: HTMLButtonElement | null = null;
    private paymentMethod: string | null = null;

    constructor(basketModel: BasketModel) {
        this.basketModel = basketModel;
    }

    public initializeOrderForm(formElement: HTMLFormElement): void {
        this.formElement = formElement;
        this.errorsContainer = this.formElement.querySelector('.form__errors');
        this.submitButton = this.formElement.querySelector('.order__button');

        if (!this.errorsContainer || !this.submitButton) {
            console.error('Ошибка: Не найдены элементы для отображения ошибок или кнопка отправки');
            return;
        }

        // Изначально блокируем кнопку отправки
        this.submitButton.disabled = true;

        // Обработка выбора метода оплаты
        const paymentButtons = this.formElement.querySelectorAll('.order__buttons button');
        paymentButtons.forEach(button => {
            button.addEventListener('click', () => {
                paymentButtons.forEach(btn => btn.classList.remove('button_alt-active'));
                button.classList.add('button_alt-active');
                this.paymentMethod = button.getAttribute('name');
                this.validateForm();
            });
        });

        // Динамическая валидация при вводе данных
        const inputs = this.formElement.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('blur', () => this.validateForm());
        });

        // Обработка отправки формы
        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));
    }

    private validateForm(): void {
        if (!this.formElement || !this.errorsContainer || !this.submitButton) return;

        const formData = new FormData(this.formElement);
        const address = (formData.get('address') || '').toString();

        // Валидация
        const errors: string[] = [];
        const addressError = ValidationService.validateAddress(address);
        if (addressError) errors.push(addressError);

        // Отображение ошибок
        this.errorsContainer.innerHTML = errors.join('<br>');

        // Активация кнопки, если нет ошибок и выбран способ оплаты
        this.submitButton.disabled = errors.length > 0 || !this.paymentMethod;
    }

    private async handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault();

        if (!this.formElement || !this.errorsContainer || !this.submitButton) return;

        const formData = new FormData(this.formElement);
        const address = (formData.get('address') || '').toString();
        const payment = this.paymentMethod === 'card' ? 'online' : 'offline';

        // Финальная валидация перед отправкой
        const errors: string[] = [];
        const addressError = ValidationService.validateAddress(address);
        if (addressError) errors.push(addressError);

        if (errors.length > 0) {
            this.errorsContainer.innerHTML = errors.join('<br>');
            return;
        }

        const order: IOrder = {
            payment,
            address,
            email: '', // Добавьте при необходимости
            phone: '',  // Добавьте при необходимости
            items: this.basketModel.getItems().map(item => item.id),
            total: this.basketModel.getTotal()
        };

        try {
            const result = await this.basketModel.createOrder(order);
            this.handleOrderSuccess(result);
        } catch (error) {
            console.error('Ошибка отправки заказа:', error);
            this.errorsContainer.innerHTML = 'Ошибка при оформлении заказа';
        }
    }

    private handleOrderSuccess(result: { total: number }): void {
        if (!this.formElement) return;

        // Закрываем модальное окно или показываем успех
        const successEvent = new CustomEvent('order:success', {
            detail: { total: result.total }
        });
        document.dispatchEvent(successEvent);
    }
}