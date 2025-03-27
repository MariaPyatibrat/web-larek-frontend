# Проектная работа "Веб-ларек"

## Оглавление
1. Обзор архитектуры
2. Технологический стек
3. Структура проекта
4. Важные файлы
5. API документация
6. Компоненты системы
7. Архитектуры проекта
8. Типы данных
9. UML-диаграмма
10. Процессы в приложении
11. Запуск и сборка

## Обзор архитектуры
Проект реализован с использованием паттерна MVP (Model-View-Presenter). Архитектура обеспечивает четкое разделение ответственности между компонентами:
1. Модели (Model) - работа с данными и бизнес-логикой

   * ProductModel - управление каталогом товаров
   * BasketModel - управление корзиной покупок
2. Представления (View) - отображение пользовательского интерфейса

   * MainPageView - главная страница с галереей товаров
   * ProductCard - универсальный компонент карточки товара
   * BasketView - отображение корзины
3. Презентер (EventEmitter) - координация взаимодействия между слоями

## Технологический стек:
**Категория**
1. Языки (TypeScript, HTML)
2. Cтилизация (SCSS)
3. Сборка (Webpack)

## Структура проекта:
- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом
- src/docs - схемы для документация проекта
- src/images - графические ресурсы
- src/pages - страницы приложения
- src/public - статические ресурсы
- src/scss - стили проекта
- src/types - типы TypeScript
- src/utils - вспомогательные утилиты
- src/vendor -  сторонние библиотеки

## Важные файлы:
- src/pages/index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/index.ts — точка входа приложения
- src/scss/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## API документация
### MainPageView

**Назначение:** Управление элементами главной страницы

**Функции:**
* Отображение товаров в галерее.
* Управление кнопкой корзины (header__basket) и счётчиком товаров (header__basket-counter).
* Обновление счётчика корзины при изменении количества товаров.
* Не зависит от структуры карточек товаров, работает с массивом данных.

**Поля:**
* basketButton (элемент с классом "header__basket")
* basketCounter (элемент с классом "header__basket-counter")

**Методы:**
```
class MainPageView {
  renderProducts(products: Product[]): void;
  updateBasketCounter(count: number): void;
  setBasketClickHandler(handler: Function): void;
}
```
### EventEmitter

**Назначение:** Центральная шина событий для связи между компонентами
**Презентер (Presenter) и EventEmitter**

Презентер — это компонент, который координирует взаимодействие между моделями (Model) и представлениями (View). Он обрабатывает логику приложения, выполняет действия и передает события.
Для связи между компонентами используется `EventEmitter`. Это объект, который генерирует и обрабатывает события. EventEmitter подписывается на события и сообщает о них другим компонентам (например, отображает изменения в корзине при добавлении товаров).

**Функции:**
* Подписка/отписка на события (on, off)
* Генерация событий (emit)
* Управление списком подписчиков
```
class EventEmitter {
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, ...args: any[]): void;
}
```

### ProductModel

**Назначение:** Управление данными о товарах

**Процессы в приложении**
1. Просмотр каталога:
- **ProductModel** загружает данные с сервера.
- Каждая карточка товара представляется компонентом **ProductCard**, который использует данные из **ProductModel** для отображения информации.
- При клике на товар, генерируется событие

**Функции:**
* Загрузка каталога товаров (loadProducts)
* Поиск товара по ID (getProduct)
* Фильтрация товаров (filterProducts)

```
class ProductModel {
  loadProducts(): Promise<void>;
  getProduct(id: string): Product | undefined;
}
```

### BasketModel

**Назначение:** Управление корзиной покупок

**Функции:**
* Добавление/удаление товаров (add, remove)
* Расчет общей суммы (getTotal)
* Очистка корзины (clear)
* Автосохранение состояния в localStorage

```
class BasketModel {
  add(productId: string): void;
  getTotal(): number;
}
```
## Компоненты системы

### ProductCard
**Назначение:** Универсальный компонент для отображения карточки товара в различных контекстах приложения

**Функции:**
* Поддержка трёх шаблонов отображения:
1. Галерея (для главной страницы)
2. Модальное окно (детальный просмотр)
3. Корзина (список покупок)

* ProductCard не хранит данные товара, а только рендерит DOM-элемент.
* Генерирует события (product:add, product:view) при взаимодействии.

**Принцип работы:**
```
constructor(
  template: HTMLTemplateElement,
  clickHandlers: {               
    basket?: (product: Product) => void,
    details?: (product: Product) => void
  },
  eventEmitter: EventEmitter
)
```
* Возвращает готовый DOM-элемент через метод render():
```
render(productData: Product): HTMLElement
```

**Связи:**
* Получает данные товаров из ProductModel (через родительские компоненты)
* Взаимодействует с BasketModel через события EventEmitter
* Используется тремя компонентами:

1. MainPageView - для отображения в галерее
2. ModalView - для детального просмотра
3. BasketView - для отображения в корзине

### BasketView
**Назначение:** Отображение содержимого корзины

**Функции:**
* Рендер списка товаров
* Отображение общей суммы
* Обновление счетчика товаров

**Связи:**
* Подписывается на события BasketModel через EventEmitter
* Отображает данные из BasketModel

### Связь между MainPageView и BasketView
* MainPageView управляет кнопкой корзины и счётчиком товаров.
* BasketView отображает список товаров и общую сумму покупки.
* BasketModel обновляет данные о корзине, а MainPageView и BasketView подписаны на его события через EventEmitter.

## Архитектура проекта

### Основные части системы:

1. Модели (Model) - работа с данными и бизнес-логикой
* ProductModel - управление каталогом товаров:

1. Загрузка данных с сервера
2. Фильтрация и поиск товаров
3. Предоставление данных по запросу

* BasketModel - управление корзиной покупок:
1. Добавление/удаление товаров
2. Подсчет общей суммы
3. Сохранение состояния в localStorage
4. Управление количеством товаров

* OrderModel - оформление заказов:
1. Валидация данных заказа 
2. Формирование заказа
3. Отправка на сервер


2. Представления (View) - пользовательский интерфейс

* MainPageView (новый) - главная страница:

1. Отображение галереи товаров
2. Управление элементами header (кнопка корзины, счётчик)
3. Поддержка будущего меню навигации

* ProductCard - универсальный компонент карточки товара:

1. Поддержка 3 шаблонов (галерея, модалка, корзина)
2. Отрисовка данных товара
3. Генерация событий при взаимодействии

* BasketView - отображение корзины:

1. Рендер списка товаров
2. Отображение общей суммы
3. Управление состоянием корзины

* CheckoutForm - форма оформления заказа:

1. Валидация введенных данных
2. Сбор информации для заказа
3. Обратная связь при отправке


3. Презентер (EventEmitter) - координация взаимодействия

* Централизованная шина событий

* Функции:

1. Подписка/отписка на события (on, off)
2. Генерация событий (emit)
3. Управление подписчиками

* Обеспечивает слабую связность компонентов

![UML-диаграмма архитектуры](src/docs/parts_of_the_system.png)

### Главные взаимодействия:

1. ProductModel/BasketModel → EventEmitter → MainPageView/BasketView
2. MainPageView → создаёт → ProductCard
3. ProductCard/CheckoutForm → EventEmitter → Модели

## Типы данных
### Основные интерфейсы:
```
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
```
### Интерфейсы моделей:
```
export interface IProductModel {
    items: Product[];
    loadProducts(): Promise<void>;
    getProduct(id: string): Product | undefined;
    filterProducts(criteria: Record<string, unknown>): Product[];
}

export interface IBasketModel {
    items: Map<string, number>;
    add(id: string): void;
    remove(id: string): void;
    clear(): void;
    getTotal(): number;
}

export interface IOrderModel {
    createOrder(data: OrderData): Promise<void>;
    validateOrder(data: OrderData): boolean;
}
```
### Интерфейсы представлений:
```
export interface IView {
    render(data?: object): HTMLElement;
}

export interface IMainPageView extends IView {
    updateBasketCounter(count: number): void; 
    setProducts(products: Product[]): void;   
    setBasketClickHandler(handler: () => void): void; 
}

export interface IProductCard extends IView {
    constructor(
        template: HTMLTemplateElement,
        handlers: {                    
            basket?: () => void,
            details?: () => void
        }
    );
    render(product: Product): HTMLElement; 
}

export interface IBasketView extends IView {
    updateItems(items: CartItem[]): void; 
    updateTotal(sum: number): void;      
}

export interface ICheckoutForm extends IView {
    setSubmitHandler(handler: (data: OrderData) => void): void;
    showValidationErrors(errors: string[]): void; 
}
```
### Дополнительные типы:
```
// События EventEmitter
export type AppEvents = {
    'product:add': { productId: string };
    'product:view': { productId: string };
    'basket:update': { items: Map<string, number> };
    'order:submit': OrderData;
};

// Конфигурация карточки товара
export type ProductCardConfig = {
    template: 'gallery' | 'modal' | 'basket';
    handlers: {
        basketClick?: () => void;
        detailsClick?: () => void;
    };
};
```
## UML-диаграмма
### Ключевые сценарии:

#### Добавление товара в корзину:
1. Пользователь кликает кнопку в ProductCard
2. Генерация события `product:add`
3. BasketModel обновляет состояние
4. Рассылка события `basket:updated`
5. MainPageView (счетчик) и BasketView (список) обновляются

#### Оформление заказа:
1. Заполнение CheckoutForm
2. Валидация через OrderModel
3. Отправка данных на сервер
4. BasketModel.clear() → обновление интерфейса

![UML-диаграмма архитектуры](src/docs/diagram.png)

### Блоки классов сгруппированы по категориям:
* Системные (EventEmitter)
```
class EventEmitter {
  +on(event: string, callback: Function): void
  +off(event: string, callback: Function): void
  +emit(event: string, ...args: any[]): void
}
```
* Модели (ProductModel, BasketModel, OrderModel)
```
class ProductModel {
  +items: Product[]
  +loadProducts(): Promise<void>
  +getProduct(id: string): Product | undefined
  +filterProducts(criteria: object): Product[]
}

class BasketModel {
  +items: Map<string, number>
  +add(id: string): void
  +remove(id: string): void
  +getTotal(): number
  +clear(): void
}

class OrderModel {
  +createOrder(data: OrderData): Promise<void>
  +validateOrder(data: OrderData): boolean
}
```
* Компоненты (MainPageView, ProductCard, BasketView, CheckoutForm)
```
class MainPageView {
  +renderProducts(products: Product[]): void
  +updateBasketCounter(count: number): void
}

class ProductCard {
  +constructor(template: HTMLTemplateElement, handlers: object)
  +render(product: Product): HTMLElement
}

class BasketView {
  +updateItems(items: CartItem[]): void
  +updateTotal(sum: number): void
}

class CheckoutForm {
  +setSubmitHandler(handler: Function): void
  +showValidationErrors(errors: string[]): void
}
```
* Сервисы (ApiService, ValidationService)
```
class ApiService {
  +get(url: string): Promise<any>
  +post(url: string, data: object): Promise<any>
}

class ValidationService {
  +validateEmail(email: string): boolean
  +validatePhone(phone: string): boolean
  +validateOrderData(data: OrderData): string[]
}
```
* Типы данных (Product, CartItem, OrderData)
```
interface Product {
  id: string
  title: string
  price: number
  description: string
  image: string
  category: string
}

interface CartItem {
  productId: string
  quantity: number
}

interface OrderData {
  items: CartItem[]
  address: string
  email: string
  phone: string
  paymentMethod: 'card' | 'cash'
}
```

## Процессы в приложении

### 1. Загрузка главной страницы:

* MainPageView инициализирует элементы header
* ProductModel загружает данные с сервера
* MainPageView получает массив товаров
* Для каждого товара создаётся ProductCard с шаблоном галереи
* Карточки рендерятся в галерее

### 2. Работа с корзиной:

* Клик по кнопке в ProductCard → событие в EventEmitter
* BasketModel обновляет состояние
* MainPageView получает событие и обновляет счётчик
* BasketView обновляет список товаров (если открыт)


## Установка и запуск
Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```
## Сборка

```
npm run build
```

или

```
yarn build
```

