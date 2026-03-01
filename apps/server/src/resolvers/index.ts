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
  { id: "user-1", name: "Tom", email: "tom@wrtn.io" },
  { id: "user-2", name: "Johnny", email: "johnny@wrtn.io" },
  { id: "user-3", name: "Ruben", email: "ruben@wrtn.io" },
  { id: "user-4", name: "Amber", email: "amber@wrtn.io" },
  { id: "user-5", name: "Jaxtyn", email: "jaxtyn@wrtn.io" },
  { id: "user-6", name: "Jasmin", email: "jasmin@wrtn.io" },
  { id: "user-7", name: "Joel", email: "joel@wrtn.io" },
  { id: "user-8", name: "Kane", email: "kane@wrtn.io" },
  { id: "user-9", name: "Lily", email: "lily@wrtn.io" },
  { id: "user-10", name: "Sam", email: "sam@wrtn.io" },
  { id: "user-11", name: "Scotty", email: "scotty@wrtn.io" },
  { id: "user-12", name: "Klee", email: "klee@wrtn.io" },
];

// ---------------------------------------------------------------------------
// Mock Data — Stock / Portfolio domain
// ---------------------------------------------------------------------------

interface StockData {
  id: string;
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  market: 'KOSPI' | 'KOSDAQ';
  currentPrice: number;
}

interface StockHoldingData {
  stockId: string;
  shares: number;
  avgBuyPrice: number;
}

interface PortfolioData {
  id: string;
  userId: string;
  holdings: StockHoldingData[];
}

const stocks: StockData[] = [
  { id: 'stock-1', ticker: '005930', name: 'Samsung Electronics', nameKr: '삼성전자', sector: '반도체', market: 'KOSPI', currentPrice: 72400 },
  { id: 'stock-2', ticker: '000660', name: 'SK Hynix', nameKr: 'SK하이닉스', sector: '반도체', market: 'KOSPI', currentPrice: 178000 },
  { id: 'stock-3', ticker: '373220', name: 'LG Energy Solution', nameKr: 'LG에너지솔루션', sector: '배터리', market: 'KOSPI', currentPrice: 368000 },
  { id: 'stock-4', ticker: '005380', name: 'Hyundai Motor', nameKr: '현대차', sector: '자동차', market: 'KOSPI', currentPrice: 234500 },
  { id: 'stock-5', ticker: '000270', name: 'Kia', nameKr: '기아', sector: '자동차', market: 'KOSPI', currentPrice: 128900 },
  { id: 'stock-6', ticker: '035420', name: 'Naver', nameKr: '네이버', sector: 'IT/플랫폼', market: 'KOSPI', currentPrice: 214000 },
  { id: 'stock-7', ticker: '035720', name: 'Kakao', nameKr: '카카오', sector: 'IT/플랫폼', market: 'KOSPI', currentPrice: 42650 },
  { id: 'stock-8', ticker: '051910', name: 'LG Chem', nameKr: 'LG화학', sector: '화학', market: 'KOSPI', currentPrice: 295000 },
  { id: 'stock-9', ticker: '006400', name: 'Samsung SDI', nameKr: '삼성SDI', sector: '배터리', market: 'KOSPI', currentPrice: 352000 },
  { id: 'stock-10', ticker: '068270', name: 'Celltrion', nameKr: '셀트리온', sector: '바이오', market: 'KOSPI', currentPrice: 185400 },
  { id: 'stock-11', ticker: '247540', name: 'Ecopro BM', nameKr: '에코프로비엠', sector: '배터리소재', market: 'KOSDAQ', currentPrice: 156200 },
  { id: 'stock-12', ticker: '091990', name: 'Celltrion Healthcare', nameKr: '셀트리온헬스케어', sector: '바이오', market: 'KOSDAQ', currentPrice: 63800 },
  { id: 'stock-13', ticker: '263750', name: 'Pearl Abyss', nameKr: '펄어비스', sector: '게임', market: 'KOSDAQ', currentPrice: 38450 },
  { id: 'stock-14', ticker: '196170', name: 'Alteogen', nameKr: '알테오젠', sector: '바이오', market: 'KOSDAQ', currentPrice: 298700 },
  { id: 'stock-15', ticker: '028300', name: 'HLB', nameKr: 'HLB', sector: '바이오', market: 'KOSDAQ', currentPrice: 78900 },
];

const portfolios: PortfolioData[] = [
  { id: 'portfolio-1', userId: 'user-1', holdings: [
    { stockId: 'stock-1', shares: 100, avgBuyPrice: 65000 },
    { stockId: 'stock-6', shares: 30, avgBuyPrice: 190000 },
    { stockId: 'stock-14', shares: 15, avgBuyPrice: 220000 },
  ]},
  { id: 'portfolio-2', userId: 'user-2', holdings: [
    { stockId: 'stock-2', shares: 50, avgBuyPrice: 195000 },
    { stockId: 'stock-7', shares: 200, avgBuyPrice: 55000 },
  ]},
  { id: 'portfolio-3', userId: 'user-3', holdings: [
    { stockId: 'stock-3', shares: 10, avgBuyPrice: 420000 },
    { stockId: 'stock-9', shares: 20, avgBuyPrice: 380000 },
    { stockId: 'stock-11', shares: 40, avgBuyPrice: 180000 },
  ]},
  { id: 'portfolio-4', userId: 'user-4', holdings: [
    { stockId: 'stock-4', shares: 25, avgBuyPrice: 180000 },
    { stockId: 'stock-5', shares: 50, avgBuyPrice: 95000 },
    { stockId: 'stock-1', shares: 200, avgBuyPrice: 58000 },
  ]},
  { id: 'portfolio-5', userId: 'user-5', holdings: [
    { stockId: 'stock-10', shares: 30, avgBuyPrice: 160000 },
    { stockId: 'stock-12', shares: 100, avgBuyPrice: 72000 },
  ]},
  { id: 'portfolio-6', userId: 'user-6', holdings: [
    { stockId: 'stock-6', shares: 45, avgBuyPrice: 230000 },
    { stockId: 'stock-7', shares: 150, avgBuyPrice: 38000 },
    { stockId: 'stock-13', shares: 80, avgBuyPrice: 42000 },
  ]},
  { id: 'portfolio-7', userId: 'user-7', holdings: [
    { stockId: 'stock-8', shares: 15, avgBuyPrice: 310000 },
    { stockId: 'stock-15', shares: 60, avgBuyPrice: 65000 },
  ]},
  { id: 'portfolio-8', userId: 'user-8', holdings: [
    { stockId: 'stock-1', shares: 300, avgBuyPrice: 78000 },
    { stockId: 'stock-2', shares: 25, avgBuyPrice: 150000 },
    { stockId: 'stock-4', shares: 15, avgBuyPrice: 210000 },
  ]},
  { id: 'portfolio-9', userId: 'user-9', holdings: [
    { stockId: 'stock-11', shares: 25, avgBuyPrice: 130000 },
    { stockId: 'stock-14', shares: 10, avgBuyPrice: 350000 },
    { stockId: 'stock-15', shares: 45, avgBuyPrice: 82000 },
  ]},
  { id: 'portfolio-10', userId: 'user-10', holdings: [
    { stockId: 'stock-3', shares: 8, avgBuyPrice: 350000 },
    { stockId: 'stock-5', shares: 70, avgBuyPrice: 110000 },
  ]},
  { id: 'portfolio-11', userId: 'user-11', holdings: [
    { stockId: 'stock-10', shares: 20, avgBuyPrice: 200000 },
    { stockId: 'stock-6', shares: 25, avgBuyPrice: 195000 },
    { stockId: 'stock-9', shares: 12, avgBuyPrice: 400000 },
    { stockId: 'stock-13', shares: 50, avgBuyPrice: 30000 },
  ]},
  { id: 'portfolio-12', userId: 'user-12', holdings: [
    { stockId: 'stock-2', shares: 40, avgBuyPrice: 160000 },
    { stockId: 'stock-8', shares: 10, avgBuyPrice: 275000 },
    { stockId: 'stock-14', shares: 20, avgBuyPrice: 250000 },
    { stockId: 'stock-1', shares: 150, avgBuyPrice: 70000 },
    { stockId: 'stock-15', shares: 30, avgBuyPrice: 60000 },
  ]},
];

// Helper functions for computed fields
function resolveHolding(h: StockHoldingData) {
  const stock = stocks.find((s) => s.id === h.stockId)!;
  const currentPrice = stock.currentPrice;
  const totalValue = currentPrice * h.shares;
  const costBasis = h.avgBuyPrice * h.shares;
  const profitLoss = totalValue - costBasis;
  const returnRate = Math.round(((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 10000) / 100;
  return { stock, shares: h.shares, avgBuyPrice: h.avgBuyPrice, currentPrice, totalValue, returnRate, profitLoss };
}

function resolvePortfolio(p: PortfolioData) {
  const resolved = p.holdings.map(resolveHolding);
  const totalValue = resolved.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = p.holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.shares, 0);
  const totalReturnRate = Math.round(((totalValue - totalCost) / totalCost) * 10000) / 100;
  return { id: p.id, userId: p.userId, holdings: resolved, totalValue, totalReturnRate };
}

let nextOrderId = 16;

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
    userId: "user-1",
    items: [
      { productId: "prod-5", quantity: 1, unitPrice: 64.99 },
    ],
    totalAmount: 64.99,
    status: "SHIPPED",
    createdAt: "2026-02-18T09:15:00Z",
  },
  {
    id: "order-3",
    userId: "user-2",
    items: [
      { productId: "prod-3", quantity: 1, unitPrice: 129.95 },
      { productId: "prod-4", quantity: 1, unitPrice: 79.50 },
    ],
    totalAmount: 209.45,
    status: "DELIVERED",
    createdAt: "2026-01-22T14:20:00Z",
  },
  {
    id: "order-4",
    userId: "user-2",
    items: [
      { productId: "prod-2", quantity: 1, unitPrice: 89.99 },
    ],
    totalAmount: 89.99,
    status: "PENDING",
    createdAt: "2026-02-27T11:00:00Z",
  },
  {
    id: "order-5",
    userId: "user-3",
    items: [
      { productId: "prod-8", quantity: 1, unitPrice: 44.99 },
      { productId: "prod-7", quantity: 1, unitPrice: 39.99 },
    ],
    totalAmount: 84.98,
    status: "CONFIRMED",
    createdAt: "2026-02-20T16:45:00Z",
  },
  {
    id: "order-6",
    userId: "user-4",
    items: [
      { productId: "prod-1", quantity: 1, unitPrice: 149.99 },
      { productId: "prod-6", quantity: 2, unitPrice: 34.99 },
    ],
    totalAmount: 219.97,
    status: "SHIPPED",
    createdAt: "2026-02-10T08:30:00Z",
  },
  {
    id: "order-7",
    userId: "user-5",
    items: [
      { productId: "prod-2", quantity: 2, unitPrice: 89.99 },
    ],
    totalAmount: 179.98,
    status: "DELIVERED",
    createdAt: "2026-01-28T13:00:00Z",
  },
  {
    id: "order-8",
    userId: "user-6",
    items: [
      { productId: "prod-3", quantity: 1, unitPrice: 129.95 },
    ],
    totalAmount: 129.95,
    status: "CANCELLED",
    createdAt: "2026-02-05T10:00:00Z",
  },
  {
    id: "order-9",
    userId: "user-7",
    items: [
      { productId: "prod-5", quantity: 1, unitPrice: 64.99 },
      { productId: "prod-8", quantity: 1, unitPrice: 44.99 },
    ],
    totalAmount: 109.98,
    status: "PENDING",
    createdAt: "2026-02-25T15:30:00Z",
  },
  {
    id: "order-10",
    userId: "user-8",
    items: [
      { productId: "prod-1", quantity: 1, unitPrice: 149.99 },
    ],
    totalAmount: 149.99,
    status: "CONFIRMED",
    createdAt: "2026-02-22T09:45:00Z",
  },
  {
    id: "order-11",
    userId: "user-9",
    items: [
      { productId: "prod-4", quantity: 1, unitPrice: 79.50 },
      { productId: "prod-3", quantity: 1, unitPrice: 129.95 },
    ],
    totalAmount: 209.45,
    status: "DELIVERED",
    createdAt: "2026-01-10T17:20:00Z",
  },
  {
    id: "order-12",
    userId: "user-10",
    items: [
      { productId: "prod-6", quantity: 3, unitPrice: 34.99 },
    ],
    totalAmount: 104.97,
    status: "SHIPPED",
    createdAt: "2026-02-15T12:00:00Z",
  },
  {
    id: "order-13",
    userId: "user-11",
    items: [
      { productId: "prod-7", quantity: 1, unitPrice: 39.99 },
      { productId: "prod-2", quantity: 1, unitPrice: 89.99 },
    ],
    totalAmount: 129.98,
    status: "PENDING",
    createdAt: "2026-02-28T14:10:00Z",
  },
  {
    id: "order-14",
    userId: "user-12",
    items: [
      { productId: "prod-1", quantity: 1, unitPrice: 149.99 },
      { productId: "prod-5", quantity: 1, unitPrice: 64.99 },
      { productId: "prod-8", quantity: 1, unitPrice: 44.99 },
    ],
    totalAmount: 259.97,
    status: "DELIVERED",
    createdAt: "2026-01-05T11:30:00Z",
  },
  {
    id: "order-15",
    userId: "user-1",
    items: [
      { productId: "prod-2", quantity: 1, unitPrice: 89.99 },
      { productId: "prod-3", quantity: 1, unitPrice: 129.95 },
    ],
    totalAmount: 219.94,
    status: "PENDING",
    createdAt: "2026-03-01T08:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const resolvers = {
  Query: {
    products: () => shuffle(products),
    product: (_: unknown, { id }: { id: string }) =>
      products.find((p) => p.id === id) ?? null,

    orders: () => shuffle(orders),
    order: (_: unknown, { id }: { id: string }) =>
      orders.find((o) => o.id === id) ?? null,

    users: () => shuffle(users),
    user: (_: unknown, { id }: { id: string }) =>
      users.find((u) => u.id === id) ?? null,

    categories: () => categories,

    stocks: () => shuffle(stocks),
    stock: (_: unknown, { id, ticker }: { id?: string; ticker?: string }) => {
      if (id) return stocks.find((s) => s.id === id) ?? null;
      if (ticker) return stocks.find((s) => s.ticker === ticker) ?? null;
      return null;
    },
    portfolios: () => shuffle(portfolios.map(resolvePortfolio)),
    portfolio: (_: unknown, { userId }: { userId: string }) => {
      const p = portfolios.find((pf) => pf.userId === userId);
      return p ? resolvePortfolio(p) : null;
    },
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
    portfolio: (user: UserData) => {
      const p = portfolios.find((pf) => pf.userId === user.id);
      return p ? resolvePortfolio(p) : null;
    },
  },

  Portfolio: {
    user: (portfolio: { userId: string }) => users.find((u) => u.id === portfolio.userId)!,
  },

  Category: {
    products: (category: CategoryData) =>
      products.filter((p) => p.categoryId === category.id),
  },
};

export default resolvers;
