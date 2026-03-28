export type Role = 'student' | 'staff';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
}

export type OrderStatus = 'awaiting_payment' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'counter' | 'qr' | 'card';
export type PaymentStatus = 'pending' | 'completed';

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
}

export type TimeSlot = '9-12' | '1-3' | '4-5:30';

export interface SeatBooking {
  id: string;
  userId: string;
  seatNumber: number; // 1 to 30
  timeSlot: TimeSlot;
  bookingDate: string;
  status: 'active' | 'cancelled';
}
