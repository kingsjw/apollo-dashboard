/** Raw SDL string for injection into AI prompts. */
export const schemaSDL = `
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: Category!
    inStock: Boolean!
    imageUrl: String
  }

  type Order {
    id: ID!
    user: User!
    items: [OrderItem!]!
    totalAmount: Float!
    status: OrderStatus!
    createdAt: String!
  }

  type OrderItem {
    product: Product!
    quantity: Int!
    unitPrice: Float!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    orders: [Order!]!
  }

  type Category {
    id: ID!
    name: String!
    products: [Product!]!
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    SHIPPED
    DELIVERED
    CANCELLED
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
    orders: [Order!]!
    order(id: ID!): Order
    users: [User!]!
    user(id: ID!): User
    categories: [Category!]!
  }

  type Mutation {
    createOrder(userId: ID!, items: [OrderItemInput!]!): Order!
    cancelOrder(id: ID!): Order!
    addProduct(name: String!, price: Float!, categoryId: ID!): Product!
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }
`;

/** SDL string with #graphql tag for Apollo Server / IDE syntax highlighting. */
const typeDefs = `#graphql\n${schemaSDL}`;

export default typeDefs;
