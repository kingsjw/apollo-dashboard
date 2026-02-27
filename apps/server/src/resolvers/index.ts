// ---------------------------------------------------------------------------
// Mock Data — E-commerce domain
// ---------------------------------------------------------------------------

interface CategoryData {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  inStock: boolean;
  imageUrl: string | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface OrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface OrderData {
  id: string;
  userId: string;
  items: OrderItemData[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

const categories: CategoryData[] = [
  { id: "cat-1", name: "Electronics" },
  { id: "cat-2", name: "Clothing" },
  { id: "cat-3", name: "Home & Kitchen" },
  { id: "cat-4", name: "Books" },
];

const products: ProductData[] = [
  {
    id: "prod-1",
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones with 30-hour battery life",
    price: 149.99,
    categoryId: "cat-1",
    inStock: true,
    imageUrl: "https://example.com/images/headphones.jpg",
  },
  {
    id: "prod-2",
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard with Cherry MX Blue switches",
    price: 89.99,
    categoryId: "cat-1",
    inStock: true,
    imageUrl: "https://example.com/images/keyboard.jpg",
  },
  {
    id: "prod-3",
    name: "Running Shoes",
    description: "Lightweight running shoes with responsive cushioning",
    price: 129.95,
    categoryId: "cat-2",
    inStock: true,
    imageUrl: "https://example.com/images/shoes.jpg",
  },
  {
    id: "prod-4",
    name: "Denim Jacket",
    description: "Classic fit denim jacket in medium wash",
    price: 79.50,
    categoryId: "cat-2",
    inStock: false,
    imageUrl: "https://example.com/images/jacket.jpg",
  },
  {
    id: "prod-5",
    name: "Coffee Maker",
    description: "12-cup programmable coffee maker with thermal carafe",
    price: 64.99,
    categoryId: "cat-3",
    inStock: true,
    imageUrl: "https://example.com/images/coffeemaker.jpg",
  },
  {
    id: "prod-6",
    name: "Cast Iron Skillet",
    description: "Pre-seasoned 12-inch cast iron skillet",
    price: 34.99,
    categoryId: "cat-3",
    inStock: true,
    imageUrl: null,
  },
  {
    id: "prod-7",
    name: "TypeScript Handbook",
    description: "Comprehensive guide to TypeScript for JavaScript developers",
    price: 39.99,
    categoryId: "cat-4",
    inStock: true,
    imageUrl: "https://example.com/images/tsbook.jpg",
  },
  {
    id: "prod-8",
    name: "GraphQL in Action",
    description: "Practical guide to building APIs with GraphQL",
    price: 44.99,
    categoryId: "cat-4",
    inStock: true,
    imageUrl: "https://example.com/images/gqlbook.jpg",
  },
];

const users: UserData[] = [
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "user-2", name: "Bob Smith", email: "bob@example.com" },
  { id: "user-3", name: "Charlie Lee", email: "charlie@example.com" },
];

let nextOrderId = 6;

const orders: OrderData[] = [
  {
    id: "order-1",
    userId: "user-1",
    items: [
      { productId: "prod-1", quantity: 1, unitPrice: 149.99 },
      { productId: "prod-7", quantity: 2, unitPrice: 39.99 },
    ],
    totalAmount: 229.97,
    status: "DELIVERED",
    createdAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "order-2",
    userId: "user-2",
    items: [
      { productId: "prod-3", quantity: 1, unitPrice: 129.95 },
    ],
    totalAmount: 129.95,
    status: "SHIPPED",
    createdAt: "2026-02-10T14:20:00Z",
  },
  {
    id: "order-3",
    userId: "user-1",
    items: [
      { productId: "prod-5", quantity: 1, unitPrice: 64.99 },
      { productId: "prod-6", quantity: 1, unitPrice: 34.99 },
    ],
    totalAmount: 99.98,
    status: "CONFIRMED",
    createdAt: "2026-02-20T09:15:00Z",
  },
  {
    id: "order-4",
    userId: "user-3",
    items: [
      { productId: "prod-2", quantity: 1, unitPrice: 89.99 },
      { productId: "prod-8", quantity: 1, unitPrice: 44.99 },
    ],
    totalAmount: 134.98,
    status: "PENDING",
    createdAt: "2026-02-25T16:45:00Z",
  },
  {
    id: "order-5",
    userId: "user-2",
    items: [
      { productId: "prod-4", quantity: 1, unitPrice: 79.50 },
    ],
    totalAmount: 79.50,
    status: "CANCELLED",
    createdAt: "2026-02-01T11:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

const resolvers = {
  Query: {
    products: () => products,
    product: (_: unknown, { id }: { id: string }) =>
      products.find((p) => p.id === id) ?? null,

    orders: () => orders,
    order: (_: unknown, { id }: { id: string }) =>
      orders.find((o) => o.id === id) ?? null,

    users: () => users,
    user: (_: unknown, { id }: { id: string }) =>
      users.find((u) => u.id === id) ?? null,

    categories: () => categories,
  },

  Mutation: {
    createOrder: (
      _: unknown,
      { userId, items }: { userId: string; items: { productId: string; quantity: number }[] },
    ) => {
      const user = users.find((u) => u.id === userId);
      if (!user) throw new Error(`User ${userId} not found`);

      const orderItems: OrderItemData[] = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      const newOrder: OrderData = {
        id: `order-${nextOrderId++}`,
        userId,
        items: orderItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      orders.push(newOrder);
      return newOrder;
    },

    cancelOrder: (_: unknown, { id }: { id: string }) => {
      const order = orders.find((o) => o.id === id);
      if (!order) throw new Error(`Order ${id} not found`);
      if (order.status === "CANCELLED") throw new Error(`Order ${id} is already cancelled`);
      if (order.status === "DELIVERED") throw new Error(`Cannot cancel a delivered order`);
      order.status = "CANCELLED";
      return order;
    },

    addProduct: (
      _: unknown,
      { name, price, categoryId }: { name: string; price: number; categoryId: string },
    ) => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) throw new Error(`Category ${categoryId} not found`);

      const newProduct: ProductData = {
        id: `prod-${products.length + 1}`,
        name,
        description: null,
        price,
        categoryId,
        inStock: true,
        imageUrl: null,
      };

      products.push(newProduct);
      return newProduct;
    },
  },

  // ---- Field-level resolvers for relationships ----

  Product: {
    category: (product: ProductData) =>
      categories.find((c) => c.id === product.categoryId)!,
  },

  Order: {
    user: (order: OrderData) => users.find((u) => u.id === order.userId)!,
    items: (order: OrderData) => order.items,
  },

  OrderItem: {
    product: (item: OrderItemData) =>
      products.find((p) => p.id === item.productId)!,
  },

  User: {
    orders: (user: UserData) => orders.filter((o) => o.userId === user.id),
  },

  Category: {
    products: (category: CategoryData) =>
      products.filter((p) => p.categoryId === category.id),
  },
};

export default resolvers;
