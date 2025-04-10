export class ValidationService {
    static validateAddress(address: string): string | null {
        if (!address || address.trim().length === 0) {
            return 'Необходимо указать адрес';
        }
        if (address.trim().length < 5) {
            return 'Укажите настоящий адрес';
        }
        return null;
    }

    static validateEmail(email: string): string | null {
        if (!email) return null; // Опциональное поле

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return 'Некорректный email';
        }
        return null;
    }

    static validatePhone(phone: string): string | null {
        if (!phone) return null; // Опциональное поле

        const phonePattern = /^\+?[0-9]{10,15}$/;
        if (!phonePattern.test(phone)) {
            return 'Некорректный телефон';
        }
        return null;
    }
}