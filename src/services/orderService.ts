import { Address, Coupon, Order, OrderItem, OrderPricing, OrderStatus, PaymentMethod } from "@/types";
import { MOCK_ORDERS } from "@/data";

const ORDERS_STORAGE_KEY = "my_ecommerce_orders_v1";

export interface CreateOrderPayload {
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  pricing: OrderPricing;
  appliedCoupon?: Coupon;
}

export const orderService = {
  /**
   * Get all orders for the current user session
   */
  async getOrders(): Promise<Order[]> {
    if (typeof window === "undefined") return MOCK_ORDERS;
    try {
      const data = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!data) {
        // Seed with initial mock orders
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(MOCK_ORDERS));
        return MOCK_ORDERS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to read orders from localStorage", e);
      return MOCK_ORDERS;
    }
  },

  /**
   * Get an order by its unique ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    return order || null;
  },

  /**
   * Create a new order (Flipkart style OD order generation)
   */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const orders = await this.getOrders();

    const randomSuffix = Math.floor(100000000000 + Math.random() * 900000000000);
    const orderNumber = `OD${randomSuffix}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: payload.userId,
      items: payload.items,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === "COD" ? "PENDING" : "PAID",
      orderStatus: "CONFIRMED",
      pricing: payload.pricing,
      appliedCoupon: payload.appliedCoupon,
      placedAt: new Date().toISOString(),
      estimatedDelivery: deliveryDate.toISOString(),
    };

    orders.unshift(newOrder);

    if (typeof window !== "undefined") {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }

    return newOrder;
  },

  /**
   * Cancel an order if it is eligible (PLACED, CONFIRMED, or PROCESSING)
   */
  async cancelOrder(orderId: string): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);

    if (index === -1) {
      throw new Error("Order not found");
    }

    const currentStatus = orders[index].orderStatus;
    if (currentStatus === "SHIPPED" || currentStatus === "OUT_FOR_DELIVERY" || currentStatus === "DELIVERED") {
      throw new Error("Item has already been shipped and cannot be cancelled directly. You can request a return after delivery.");
    }

    orders[index].orderStatus = "CANCELLED";

    if (typeof window !== "undefined") {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }

    return orders[index];
  },

  /**
   * Update tracking status (for simulation)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);

    if (index === -1) {
      throw new Error("Order not found");
    }

    orders[index].orderStatus = status;
    if (status === "DELIVERED") {
      orders[index].deliveredAt = new Date().toISOString();
      orders[index].paymentStatus = "PAID";
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }

    return orders[index];
  },
};
