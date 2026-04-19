import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SfGtVz1qtTYbdF',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'bSEBXQnYILTv9FM2zsJ2A3gu',
});

// Since the server will securely update orders in Supabase,
// we can use the service_role key to bypass RLS, OR the anon_key if policies allow.
// In this case, we use what's available in .env
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 1. Create Order Route
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message, stack: error.stack });
  }
});

// 2. Verify Payment Route
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      // For updating our own DB:
      supabase_order_id 
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'bSEBXQnYILTv9FM2zsJ2A3gu')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Secret Server-Side Update of Supabase Order marking it paid
      if (supabase_order_id) {
        let { error } = await supabase
          .from('orders')
          .update({ 
            status: 'pending', // Moving from 'awaiting_payment' to 'pending'
            payment_status: 'completed',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
          })
          .eq('id', supabase_order_id);
          
        if (error) {
           console.warn("Failed to update with razorpay columns. Trying fallback:", error);
           // Fallback if columns don't exist in Supabase
           const fallbackUpdate = await supabase
             .from('orders')
             .update({
               status: 'pending',
               payment_status: 'completed'
             })
             .eq('id', supabase_order_id);
           
           if (fallbackUpdate.error) {
             console.error("Fallback update also failed:", fallbackUpdate.error);
             return res.status(500).json({ success: false, message: 'Payment verified but DB update failed.' });
           }
        }
      }

      res.json({ success: true, message: 'Payment verified successfully', paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Razorpay Backend Server running on port ${PORT}`);
});
