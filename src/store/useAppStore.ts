import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, MenuItem, Order, SeatBooking, OrderItem } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  isCanteenOpen: boolean;
  toggleCanteenStatus: () => void;
  
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  initializeAuth: () => void;
  fetchInitialData: () => Promise<void>;
  
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  
  orders: Order[];
  placeOrder: (
    userId: string, 
    items: OrderItem[], 
    totalAmount: number, 
    paymentMethod: Order['paymentMethod'], 
    paymentStatus: Order['paymentStatus'], 
    status: Order['status'],
    extras?: {
      orderType?: Order['orderType'];
      orderedBy?: Order['orderedBy'];
      building?: string;
      roomNumber?: string;
      locationType?: string;
      notes?: string;
    }
  ) => Promise<string | undefined>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateOrderPaymentAndStatus: (orderId: string, status: Order['status'], paymentStatus: Order['paymentStatus']) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  
  bookings: SeatBooking[];
  bookSeat: (userId: string, seatNumber: number, timeSlot: SeatBooking['timeSlot'], date: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      isCanteenOpen: true,
      toggleCanteenStatus: () => set((state) => ({ isCanteenOpen: !state.isCanteenOpen })),
      
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      initializeAuth: () => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            set({
              currentUser: {
                id: session.user.id,
                email: session.user.email || '',
                fullName: session.user.user_metadata?.full_name || '',
                role: session.user.user_metadata?.role || 'student'
              }
            });
            get().fetchInitialData();
          } else {
            set({ currentUser: null });
            get().fetchInitialData(); // Still fetch menu items for landing page if needed
          }
        });

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            set({
              currentUser: {
                id: session.user.id,
                email: session.user.email || '',
                fullName: session.user.user_metadata?.full_name || '',
                role: session.user.user_metadata?.role || 'student'
              }
            });
            get().fetchInitialData();
          } else {
            set({ currentUser: null, orders: [], bookings: [] });
          }
        });

        // Setup Realtime subscriptions
        supabase.channel('public:menu_items')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
            get().fetchInitialData();
          })
          .subscribe();

        supabase.channel('public:orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
             get().fetchInitialData();
          })
          .subscribe();

        supabase.channel('public:seat_bookings')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_bookings' }, () => {
             get().fetchInitialData();
          })
          .subscribe();
      },

      fetchInitialData: async () => {
        const { currentUser } = get();
        // Fetch menu
        const { data: menuData } = await supabase.from('menu_items').select('*').order('name');
        if (menuData) {
          set({
            menuItems: menuData.map(d => ({
              id: d.id,
              name: d.name,
              description: d.description,
              price: Number(d.price),
              category: d.category,
              imageUrl: d.image_url,
              isAvailable: d.is_available
            }))
          });
        }

        if (currentUser) {
          let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (currentUser.role === 'student') query = query.eq('user_id', currentUser.id);
          
          const { data: orderData, error: orderErr } = await query;
          if (orderErr) console.error("Fetch Orders Error:", orderErr);
          
          if (orderData) {
            set({
              orders: orderData.map(d => ({
                id: d.id,
                userId: d.user_id,
                items: d.items,
                status: d.status,
                paymentMethod: d.payment_method,
                paymentStatus: d.payment_status,
                totalAmount: Number(d.total_amount),
                createdAt: d.created_at,
                orderType: d.order_type,
                orderedBy: d.ordered_by,
                building: d.building,
                roomNumber: d.room_number,
                locationType: d.location_type,
                notes: d.notes
              }))
            });
          }

          const { data: bookingData, error: bookErr } = await supabase.from('seat_bookings').select('*');
          if (bookErr) console.error("Fetch Bookings Error:", bookErr);
          
          if (bookingData) {
            set({
              bookings: bookingData.map(d => ({
                id: d.id,
                userId: d.user_id,
                seatNumber: d.seat_number,
                timeSlot: d.time_slot,
                bookingDate: d.booking_date,
                status: d.status
              }))
            });
          }
        }
      },
      
      menuItems: [],
      addMenuItem: async (item) => {
        await supabase.from('menu_items').insert({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.imageUrl,
          is_available: item.isAvailable
        });
        get().fetchInitialData();
      },
      updateMenuItem: async (id, updates) => {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
        if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;
        await supabase.from('menu_items').update(payload).eq('id', id);
        await get().fetchInitialData();
      },
      deleteMenuItem: async (id) => {
        await supabase.from('menu_items').delete().eq('id', id);
        await get().fetchInitialData();
      },
      
      orders: [],
      placeOrder: async (userId, items, totalAmount, paymentMethod, paymentStatus, status, extras) => {
        const mappedPaymentMethod = paymentMethod === 'razorpay' ? 'card' : paymentMethod;
        
        // Step 1: Insert without selecting if RLS blocks it
        const { error: insertError } = await supabase.from('orders').insert({
          user_id: userId,
          items,
          payment_method: mappedPaymentMethod,
          payment_status: paymentStatus,
          status: status,
          total_amount: totalAmount,
          order_type: extras?.orderType || 'canteen_pickup',
          ordered_by: extras?.orderedBy || 'student',
          building: extras?.building,
          room_number: extras?.roomNumber,
          location_type: extras?.locationType,
          notes: extras?.notes
        });
        
        if (insertError) {
          console.error("Supabase insert error:", insertError);
          alert(`DB Error: ${insertError.message}`);
          return undefined;
        }
        
        // Step 2: Fetch the latest inserted order explicitly to avoid RLS select-on-insert issues
        const { data: latestOrder } = await supabase.from('orders')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        await get().fetchInitialData();
        return latestOrder?.id;
      },
      updateOrderStatus: async (orderId, status) => {
        await supabase.from('orders').update({ status }).eq('id', orderId);
        await get().fetchInitialData();
      },
      updateOrderPaymentAndStatus: async (orderId, status, paymentStatus) => {
        await supabase.from('orders').update({ status, payment_status: paymentStatus }).eq('id', orderId);
        await get().fetchInitialData();
      },
      cancelOrder: async (orderId) => {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        await get().fetchInitialData();
      },
      
      bookings: [],
      bookSeat: async (userId, seatNumber, timeSlot, date) => {
        await supabase.from('seat_bookings').insert({
          user_id: userId,
          seat_number: seatNumber,
          time_slot: timeSlot,
          booking_date: date,
          status: 'active'
        });
        await get().fetchInitialData();
      },
      cancelBooking: async (bookingId) => {
        await supabase.from('seat_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
        await get().fetchInitialData();
      }
    }),
    {
      name: 'foodhub-storage',
      partialize: (state) => ({
        theme: state.theme,
        isCanteenOpen: state.isCanteenOpen
      }),
    }
  )
);
