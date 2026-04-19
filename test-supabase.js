import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('orders').insert({
    user_id: "7774e144-b251-4043-bed1-c06bdf567a21", // Just some UUID, or null
    items: [],
    payment_method: "razorpay",
    payment_status: "pending",
    status: "awaiting_payment",
    total_amount: 100,
  }).select('id');
  console.log(JSON.stringify(error, null, 2));
}
test();
