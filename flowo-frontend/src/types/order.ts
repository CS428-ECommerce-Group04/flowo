export type OrderStatus = "processing" | "out_for_delivery" | "delivered";

export type Order = {
  id: string;                 // e.g. "ORD-2024-001"
  customer: string;           // e.g. "Sarah Johnson"
  total: number;              // 85
  orderDate: string;          // ISO or display string, e.g. "2024-01-15"
  status: OrderStatus;
  items: string[];            // short tags like ["roses","tulip"], or emojis
};

export type TimelineStep = {
  key: string;
  title: string;
  desc: string;
  at?: string;                           // display time, e.g., "Jan 15, 2024 – 9:30 AM"
  status: "done" | "current" | "pending";
};

export type Driver = {
  name: string;
  phone: string;
  vehicle?: string;
  initials?: string;
};

export type OrderItemRow = {
  id: string;
  name: string;
  qty: number;
  price: number;
  tags?: string[];
  icon?: string;                         // emoji for thumbnail
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  eta?: string;                          // e.g., "Today, 2:00 PM – 6:00 PM"
  address: string;
  customer: string;
  phone: string;
  timeline: TimelineStep[];
  driver?: Driver;
  items: OrderItemRow[];
  subtotal: number;
};