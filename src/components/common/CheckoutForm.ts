import { BasketModel } from '../models/BasketModel';
import { ValidationService } from './ValidationService';

interface OrderData {
    address?: string;
    payment?: 'online' | 'offline';
}

const PaymentMethods = {
    ONLINE: 'online',
    OFFLINE: 'offline'
} as const;

export class CheckoutForm {
    constructor(private basketModel: BasketModel) {}

    public initializeOrderForm(formElement: HTMLFormElement): void {
        const submitButton = formElement.querySelector('.order__button') as HTMLButtonElement | null;
        const errorsContainer = formElement.querySelector('.form__errors') as HTMLElement | null;

        if (!errorsContainer || !submitButton) {
            throw new Error('Required form elements not found');
        }

        submitButton.disabled = true;
        const savedData = this.basketModel.getOrderData() as OrderData;

        this.initAddressField(formElement, savedData, errorsContainer, submitButton);
        this.initPaymentButtons(formElement, savedData, errorsContainer, submitButton);

        this.validateOrderForm(formElement, errorsContainer, submitButton);
    }

    private initAddressField(
        form: HTMLFormElement,
        savedData: OrderData,
        errorsContainer: HTMLElement,
        submitButton: HTMLButtonElement
    ) {
        const addressInput = form.querySelector('input[name="address"]') as HTMLInputElement | null;
        if (!addressInput) return;

        if (savedData.address) {
            addressInput.value = savedData.address;
        }

        addressInput.addEventListener('input', () => {
            this.basketModel.setOrderField('address', addressInput.value);
            this.validateOrderForm(form, errorsContainer, submitButton);
        });
    }

    private initPaymentButtons(
        form: HTMLFormElement,
        savedData: OrderData,
        errorsContainer: HTMLElement,
        submitButton: HTMLButtonElement
    ) {
        const paymentButtons = form.querySelectorAll('.order__buttons button');
        paymentButtons.forEach(button => {
            const paymentType = button.getAttribute('name') === 'card'
                ? PaymentMethods.ONLINE
                : PaymentMethods.OFFLINE;

            if (paymentType === savedData.payment) {
                button.classList.add('button_alt-active');
            }

            button.addEventListener('click', () => {
                paymentButtons.forEach(btn => btn.classList.remove('button_alt-active'));
                button.classList.add('button_alt-active');
                this.basketModel.setOrderField('payment', paymentType);
                this.validateOrderForm(form, errorsContainer, submitButton);
            });
        });
    }

    private validateOrderForm(
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