import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  );

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      supabase_order_id 
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'bSEBXQnYILTv9FM2zsJ2A3gu')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    if (supabase_order_id) {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'pending',
          payment_status: 'completed',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        })
        .eq('id', supabase_order_id);
        
      if (error) {
        console.warn("Failed to update with razorpay columns. Trying fallback.");
        const fallbackUpdate = await supabase
          .from('orders')
          .update({
            status: 'pending',
            payment_status: 'completed'
          })
          .eq('id', supabase_order_id);
          
        if (fallbackUpdate.error) {
          return res.status(500).json({ success: false, message: 'Payment verified but DB update failed.' });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Payment verified successfully', paymentId: razorpay_payment_id });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}
