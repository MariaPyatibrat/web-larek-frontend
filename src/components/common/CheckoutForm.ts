import { ValidationService } from './ValidationService';
import { BasketModel } from '../models/BasketModel';

export class CheckoutForm {
    constructor(private basketModel: BasketModel) {}

    public initializeOrderForm(formElement: HTMLFormElement): void {
        const errorsContainer = formElement.querySelector('.form__errors') as HTMLElement | null;
        const submitButton = formElement.querySelector('.order__button') as HTMLButtonElement | null;

        if (!errorsContainer || !submitButton) {
            console.error('Required elements not found');
            return;
        }

        const savedData = this.basketModel.getOrderData();
        const addressInput = formElement.querySelector('input[name="address"]') as HTMLInputElement | null;
        if (addressInput && savedData.address) {
            addressInput.value = savedData.address;
        }

        const paymentButtons = formElement.querySelectorAll('.order__buttons button');
        paymentButtons.forEach(button => {
            if (button.getAttribute('name') === savedData.payment) {
                button.classList.add('button_alt-active');
            }

            button.addEventListener('click', () => {
                paymentButtons.forEach(btn => btn.classList.remove('button_alt-active'));
                button.classList.add('button_alt-active');
                this.basketModel.setOrderField('payment', button.getAttribute('name') === 'card' ? 'online' : 'offline');
                this.validateForm(formElement, errorsContainer, submitButton);
            });
        });

        formElement.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.name === 'address') {
                    this.basketModel.setOrderField('address', input.value);
                }
                this.validateForm(formElement, errorsContainer, submitButton);
            });
        });

        this.validateForm(formElement, errorsContainer, submitButton);

        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const orderData = this.basketModel.getOrderData();
            if (orderData.address && orderData.payment) {
                submitButton!.disabled = true;
            }
        });
    }

    private validateForm(
        form: HTMLFormElement,
        errorsContainer: HTMLElement,
        submitButton: HTMLButtonElement
    ): void {
        const formData = new FormData(form);
        const address = (formData.get('address') || '').toString();
        const paymentMethod = this.basketModel.getOrderData().payment;

        const errors: string[] = [];
        const addressError = ValidationService.validateAddress(address);
        if (addressError) errors.push(addressError);
        if (!paymentMethod) errors.push('Выберите способ оплаты');

        errorsContainer.textContent = errors.join('\n');
        submitButton.disabled = errors.length > 0;
    }
}
