import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { MenuItem, OrderType, OrderedBy } from '../../types';
import { ShoppingCart, Plus, Minus, CreditCard, Banknote, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const { menuItems, currentUser, placeOrder, isCanteenOpen } = useAppStore();
  const navigate = useNavigate();
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'counter' | 'razorpay'>('counter');
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery States
  const [orderType, setOrderType] = useState<OrderType>('canteen_pickup');
  const [orderedBy, setOrderedBy] = useState<OrderedBy>('student');
  const [building, setBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [locationType, setLocationType] = useState('Classroom');
  const [notes, setNotes] = useState('');

  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter(m => m.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.item.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

  const handleCheckoutClick = () => {
    if (!currentUser || cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (document.querySelector('#razorpay-js')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const confirmPayment = async () => {
    if (!currentUser || cart.length === 0) return;
    setIsProcessing(true);

    const orderItems = cart.map(c => ({
      menuItemId: c.item.id,
      quantity: c.quantity,
      price: c.item.price
    }));
    
    const extras = { orderType, orderedBy, building, roomNumber, locationType, notes };
    
    if (paymentMethod === 'counter') {
      setTimeout(async () => {
        await placeOrder(currentUser.id, orderItems, totalAmount, 'counter', 'pending', 'awaiting_payment', extras);
        setCart([]);
        setIsProcessing(false);
        setShowPaymentModal(false);
        navigate('/student/orders');
      }, 500);
    } else if (paymentMethod === 'razorpay') {
      try {
        // 1. Create order in our database as awaiting_payment
        const supabaseOrderId = await placeOrder(currentUser.id, orderItems, totalAmount, 'razorpay', 'pending', 'awaiting_payment', extras);
        
        if (!supabaseOrderId) throw new Error("Failed to create order in database");

        // 2. Fetch Razorpay order ID from our secure backend
        const resOrder = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount })
        });
        
        const contentType = resOrder.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           throw new Error("Server configuration error: Endpoint did not return JSON. If on Vercel, ensure api/ directory is deployed correctly.");
        }
        
        const orderData = await resOrder.json();
        if (!orderData.success) throw new Error(orderData.message || "Failed to initialize payment");

        // 3. Load Razorpay SDK window
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          alert('Failed to load Razorpay SDK. Are you online?');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SfGtVz1qtTYbdF', 
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.order_id,
          name: 'MealMate',
          description: 'Delicious Food Delivery',
          // Optionally force UPI rendering if backend allows it:
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [
                    { method: "upi" }
                  ]
                },
                other: {
                  name: "Other Payment Modes",
                  instruments: [
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                    { method: "paylater" }
                  ]
                }
              },
              sequence: ["block.upi", "block.other"],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          handler: async function (response: any) {
            // 4. Secure Verification on Backend
            setIsProcessing(true);
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  supabase_order_id: supabaseOrderId
                })
              });
              
              const vContentType = verifyRes.headers.get("content-type");
              if (!vContentType || !vContentType.includes("application/json")) {
                 throw new Error("Payment verification failed due to server routing misconfiguration.");
              }
              
              const verification = await verifyRes.json();
              
              if (verification.success) {
                setCart([]);
                setShowPaymentModal(false);
                navigate('/student/orders');
              } else {
                throw new Error(verification.message || "Payment verification failed on the server.");
              }
            } catch (err: any) {
              alert(err.message || 'Payment verification encountered an unexpected error.');
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: currentUser.fullName,
            email: currentUser.email,
            contact: '9999999999'
          },
          theme: { color: '#3b82f6' },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
            }
          }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', function (response: any) {
          alert('Payment failed: ' + response.error.description);
          setIsProcessing(false);
        });
        paymentObject.open();

      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Payment initialization failed.');
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative pb-24 lg:pb-0">
      <div className="flex-1 animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Food Menu</h1>
        
        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap transition-all font-medium ${
                selectedCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-white/5 text-textMuted hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="glass-panel overflow-hidden group border-white/5 hover:border-primary/40 transition-all duration-300 flex flex-col h-full">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                     <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Sold Out</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-white border border-white/10">
                  ₹{item.price}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                </div>
                <p className="text-sm text-textMuted flex-1 line-clamp-2">{item.description}</p>
                
                <button 
                  onClick={() => addToCart(item)}
                  disabled={!item.isAvailable || !isCanteenOpen}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-primary hover:border-primary text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
             <div className="col-span-full py-12 text-center text-textMuted border border-white/5 rounded-2xl glass-panel">
                No items found in this category.
             </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`fixed inset-x-0 bottom-0 lg:static lg:w-96 rounded-t-3xl lg:rounded-2xl glass-panel border-t border-white/10 lg:border z-40 transition-transform ${cart.length > 0 ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
        <div className="p-6 h-[70vh] lg:h-[calc(100vh-8rem)] flex flex-col lg:sticky lg:top-24">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
            <h2 className="text-xl font-bold flex-1">Your Order</h2>
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm font-medium">
              {cart.reduce((s, c) => s + c.quantity, 0)} Items
            </span>
          </div>

          {!isCanteenOpen && (
             <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-sm flex items-start gap-3">
               <div className="mt-0.5">⚠️</div>
               <p>The canteen is currently closed. You cannot place new orders right now. Please check back later.</p>
             </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-sm mt-2 text-center px-4">Add some delicious items from the menu to get started.</p>
              </div>
            ) : (
              cart.map((c) => (
                <div key={c.item.id} className="flex items-start gap-4">
                  <img src={c.item.imageUrl} alt={c.item.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm line-clamp-1">{c.item.name}</h4>
                    <p className="text-primary font-medium text-sm">₹{c.item.price * c.quantity}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <button onClick={() => removeFromCart(c.item.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                         <Minus size={14} />
                       </button>
                       <span className="text-sm font-medium w-4 text-center">{c.quantity}</span>
                       <button onClick={() => addToCart(c.item)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                         <Plus size={14} />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              {/* Delivery Options */}
              <div className="mb-6 space-y-4">
                <h3 className="font-bold text-sm text-textMuted uppercase tracking-wider">Delivery Option</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => setOrderType('canteen_pickup')} className={`p-2 rounded-lg text-sm font-medium border transition-all ${orderType === 'canteen_pickup' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>Pickup</button>
                  <button onClick={() => setOrderType('seat_delivery')} className={`p-2 rounded-lg text-sm font-medium border transition-all ${orderType === 'seat_delivery' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>Seat</button>
                  <button onClick={() => setOrderType('classroom_delivery')} className={`p-2 rounded-lg text-sm font-medium border transition-all ${orderType === 'classroom_delivery' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>Classroom</button>
                </div>

                {orderType === 'classroom_delivery' && (
                  <div className="p-4 bg-black/20 rounded-xl space-y-4 border border-white/5 mt-3 animate-fade-in shadow-inner">
                    <div>
                      <label className="text-xs text-textMuted font-medium block mb-1">Ordered By</label>
                      <div className="flex bg-white/5 rounded-lg p-1">
                        <button onClick={() => setOrderedBy('student')} className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${orderedBy === 'student' ? 'bg-white/10 text-white shadow-xs' : 'text-textMuted hover:text-white'}`}>Student</button>
                        <button onClick={() => setOrderedBy('teacher')} className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${orderedBy === 'teacher' ? 'bg-white/10 text-white shadow-xs' : 'text-textMuted hover:text-white'}`}>Teacher</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-textMuted font-medium block mb-1">Building/Block</label>
                        <input value={building} onChange={(e) => setBuilding(e.target.value)} type="text" placeholder="e.g. Block A" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-textMuted font-medium block mb-1">Room No.</label>
                        <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} type="text" placeholder="e.g. 204" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-textMuted font-medium block mb-1">Loc. Type</label>
                        <select value={locationType} onChange={(e) => setLocationType(e.target.value)} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white [&>option]:bg-surface">
                          <option>Classroom</option>
                          <option>Staff Room</option>
                          <option>HOD Cabin</option>
                          <option>Lab</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-textMuted font-medium block mb-1">Notes</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Opt." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-textMuted font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
              </div>
              
              <button
                onClick={handleCheckoutClick}
                disabled={!isCanteenOpen}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <>
                    <CreditCard size={20} />
                    Checkout ₹{totalAmount}
                  </>
                {/* Shine effect */}
                <div className="absolute top-0 -left-full w-1/2 h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shine_3s_infinite]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Options Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Payment Method</h3>
              <button 
                onClick={() => !isProcessing && setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-textMuted dark:hover:text-white transition-colors"
                disabled={isProcessing}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <button
                onClick={() => setPaymentMethod('counter')}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${paymentMethod === 'counter' ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'}`}
                disabled={isProcessing}
              >
                <div className={`p-3 rounded-lg flex shrink-0 ${paymentMethod === 'counter' ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white'}`}>
                  <Banknote size={24} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Pay at Counter</h4>
                  <p className="text-sm text-gray-500 dark:text-textMuted">Pay with cash when you pick up</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'}`}
                disabled={isProcessing}
              >
                <div className={`p-3 rounded-lg flex shrink-0 ${paymentMethod === 'razorpay' ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white'}`}>
                  <CreditCard size={24} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">Pay with Razorpay</h4>
                  <p className="text-sm text-gray-500 dark:text-textMuted">Secure online payment</p>
                </div>
              </button>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/20">
              <button
                onClick={confirmPayment}
                disabled={isProcessing}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Complete Payment of ₹{totalAmount}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
