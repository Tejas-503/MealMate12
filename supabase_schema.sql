-- ==========================================
-- MealMate Database Schema & Seed Script
-- Run this in your Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Run)
-- ==========================================

-- 1. Create Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL DEFAULT 'counter',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    order_type TEXT DEFAULT 'canteen_pickup',
    ordered_by TEXT DEFAULT 'student',
    building TEXT,
    room_number TEXT,
    location_type TEXT,
    notes TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Seat Bookings Table
CREATE TABLE IF NOT EXISTS public.seat_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    seat_number INTEGER NOT NULL,
    time_slot TEXT NOT NULL,
    booking_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_bookings ENABLE ROW LEVEL SECURITY;

-- Menu Items Policies (Everyone can view, authenticated can manage)
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert menu items" ON public.menu_items;
CREATE POLICY "Anyone can insert menu items" ON public.menu_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update menu items" ON public.menu_items;
CREATE POLICY "Anyone can update menu items" ON public.menu_items
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete menu items" ON public.menu_items;
CREATE POLICY "Anyone can delete menu items" ON public.menu_items
    FOR DELETE USING (true);

-- Orders Policies
DROP POLICY IF EXISTS "Allow select on orders" ON public.orders;
CREATE POLICY "Allow select on orders" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on orders" ON public.orders;
CREATE POLICY "Allow insert on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on orders" ON public.orders;
CREATE POLICY "Allow update on orders" ON public.orders
    FOR UPDATE USING (true);

-- Seat Bookings Policies
DROP POLICY IF EXISTS "Allow select on seat_bookings" ON public.seat_bookings;
CREATE POLICY "Allow select on seat_bookings" ON public.seat_bookings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on seat_bookings" ON public.seat_bookings;
CREATE POLICY "Allow insert on seat_bookings" ON public.seat_bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on seat_bookings" ON public.seat_bookings;
CREATE POLICY "Allow update on seat_bookings" ON public.seat_bookings
    FOR UPDATE USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_bookings;

-- ==========================================
-- SEED DATA: Delicious Menu Items
-- ==========================================
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available)
VALUES
    ('Veg Cheese Burger', 'Crispy spiced potato patty topped with melted cheese, lettuce, and house mayo.', 80.00, 'Fast Food', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', true),
    ('Paneer Tikka Sandwich', 'Grilled multigrain bread loaded with marinated paneer, capsicum, and mint chutney.', 110.00, 'Sandwiches', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', true),
    ('Masala Dosa', 'Golden crispy rice crepe served with flavorful potato masala, coconut chutney, and sambar.', 70.00, 'South Indian', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80', true),
    ('Cold Coffee with Ice Cream', 'Chilled brewed coffee blended rich and creamy, topped with a scoop of vanilla ice cream.', 65.00, 'Beverages', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', true),
    ('Schezwan Veg Fried Rice', 'Wok-tossed basmati rice tossed with fresh garden vegetables in spicy schezwan sauce.', 120.00, 'Chinese', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', true),
    ('Chole Bhature', 'Two fluffy fried bhature served with spicy chickpea curry, pickled onions, and green chili.', 95.00, 'Meals', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80', true),
    ('Peri Peri French Fries', 'Crispy skin-on french fries tossed with tangy peri-peri seasoning and cheese dip.', 60.00, 'Snacks', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', true),
    ('Iced Lemon Tea', 'Refreshing black tea infused with real lemon juice and fresh mint leaves.', 45.00, 'Beverages', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT DO NOTHING;
