// Базовые сущности (модели данных)
export interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
    image: string;
    category: string;
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface OrderData {
    items: CartItem[];
    address: string;
    email: string;
    phone: string;
    paymentMethod: 'card' | 'cash';
}


// Системные интерфейсы (EventEmitter, сервисы)

export type EventCallback = (...args: unknown[]) => void;

export interface IEventEmitter {
    // Подписка на событие
    on(event: string, callback: EventCallback): void;
    // Отписка от события
    off(event: string, callback: EventCallback): void;
    // Генерация события с передачей данных
    emit(event: string, ...args: unknown[]): void;
}

// Интерфейс конструктора для EventEmitter (если требуется передавать класс по имени)
export interface IEventEmitterConstructor {
    new (): IEventEmitter;
}

// Интерфейс для работы с API
export interface IApiService {
    get(endpoint: string): Promise<unknown>;
    post(endpoint: string, data: Record<string, unknown>): Promise<unknown>;
    handleResponse(response: Response): unknown;
}

// Модели (Model)

export interface IProductModel {
    // Коллекция товаров
    items: Product[];
    // Загружает список товаров
    loadProducts(): Promise<void>;
    // Возвращает товар по ID
    getProduct(id: string): Product | undefined;
    // Фильтрует товары по заданным критериям
    filterProducts(criteria: Record<string, unknown>): Product[];
}

export interface IBasketModel {
    // Коллекция товаров в корзине (например, Map с id и количеством)
    items: Map<string, number>;
    // Добавляет товар в корзину
    add(id: string): void;
    // Удаляет товар из корзины
    remove(id: string): void;
    // Очищает корзину
    clear(): void;
    // Вычисляет общую стоимость товаров в корзине
    getTotal(): number;
}

export interface IOrderModel {
    // Создает заказ
    createOrder(data: OrderData): Promise<void>;
    // Валидирует данные заказа
    validateOrder(data: OrderData): boolean;
}

// Компоненты (View) — визуальный слой (MVP)

export interface IView {
    // Рендер компонента
    render(data?: object): HTMLElement;
}
// Интерфейс конструктора для компонента (если требуется передавать класс по имени)
export interface IViewConstructor {
    new (container: HTMLElement, events?: IEventEmitter): IView;
}

// Интерфейс карточки товара (ProductCard)
export interface IProductCard extends IView {
    product: Product;
    // Обработчик клика по карточке товара
    onClick(): void;
}

// Интерфейс конструктора для карточки товара
export interface IProductCardConstructor {
    new (product: Product, container: HTMLElement, events?: IEventEmitter): IProductCard;
}

// Интерфейс компонента отображения корзины (BasketView)
export interface IBasketView extends IView {
    items: CartItem[];
    // Обновляет счетчик товаров в корзине
    updateCounter(count: number): void;
}

// Интерфейс конструктора для компонента корзины
export interface IBasketViewConstructor {
    new (container: HTMLElement, events?: IEventEmitter): IBasketView;
}

// Интерфейс компонента формы оформления заказа (CheckoutForm)
export interface ICheckoutForm extends IView {
    formData: OrderData;
    // Обработчик отправки формы
    onSubmit(): void;
}
