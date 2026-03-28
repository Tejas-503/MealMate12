import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PackageX, CheckCircle2, Clock, MapPin, XCircle, RefreshCcw, Banknote } from 'lucide-react';
import { parseISO, differenceInMinutes } from 'date-fns';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'awaiting_payment': return <Banknote className="text-orange-400" />;
    case 'pending': return <Clock className="text-yellow-400" />;
    case 'preparing': return <RefreshCcw className="text-blue-400 animate-spin-pulse" />;
    case 'ready': return <MapPin className="text-indigo-400" />;
    case 'completed': return <CheckCircle2 className="text-green-400" />;
    case 'cancelled': return <XCircle className="text-red-400" />;
    default: return <Clock />;
  }
};

const StatusColor = (status: string) => {
  switch (status) {
    case 'awaiting_payment': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'preparing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'ready': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

const OrderHistory = () => {
  const { currentUser, orders, menuItems, cancelOrder } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to check 5-min cancellation window
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const myOrders = orders.filter(o => o.userId === currentUser?.id);

  if (myOrders.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center animate-fade-in text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <PackageX size={32} className="text-textMuted" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
        <p className="text-textMuted max-w-sm">You haven't placed any orders. Go to the menu to grab a bite!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Order History & Tracking</h1>
      <p className="text-textMuted mb-8">Track your food status real-time. You can cancel orders within 5 minutes of placing them if they are still pending.</p>

      <div className="space-y-6">
        {myOrders.map(order => {
          const orderDate = parseISO(order.createdAt);
          const minsPassed = differenceInMinutes(currentTime, orderDate);
          const canCancel = order.status === 'pending' && minsPassed < 5;

          return (
            <div key={order.id} className="glass-panel p-6 border-l-4" style={{ 
               borderLeftColor: order.status === 'completed' ? '#4ade80' : 
                                order.status === 'cancelled' ? '#f87171' : 
                                order.status === 'ready' ? '#818cf8' : 
                                order.status === 'preparing' ? '#60a5fa' : '#facc15'
            }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">Order {order.id.slice(-8)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1.5 border ${StatusColor(order.status)}`}>
                       <StatusIcon status={order.status} /> {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-textMuted">Placed on {orderDate.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                   <div>
                     <p className="text-sm text-textMuted">Total Amount</p>
                     <p className="text-xl font-bold text-white">₹{order.totalAmount}</p>
                   </div>
                   {canCancel && (
                     <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            cancelOrder(order.id);
                          }
                        }}
                        className="ml-4 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl font-medium transition-all text-sm"
                     >
                       Cancel Order {5 - minsPassed}m left
                     </button>
                   )}
                </div>
              </div>

              {/* Progress Bar for Active Orders */}
              {!['completed', 'cancelled'].includes(order.status) && (
                <div className="mb-6 px-2">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                    {order.paymentMethod === 'counter' && (
                       <div className={`h-full bg-orange-400 transition-all ${['awaiting_payment', 'pending', 'preparing', 'ready'].includes(order.status) ? 'w-1/4' : 'w-0'}`} />
                    )}
                    <div className={`h-full bg-yellow-400 transition-all ${['pending', 'preparing', 'ready'].includes(order.status) ? (order.paymentMethod === 'counter' ? 'w-1/4' : 'w-1/3') : 'w-0'}`} />
                    <div className={`h-full bg-blue-400 transition-all ${['preparing', 'ready'].includes(order.status) ? (order.paymentMethod === 'counter' ? 'w-1/4' : 'w-1/3') : 'w-0'}`} />
                    <div className={`h-full bg-indigo-400 transition-all ${order.status === 'ready' ? (order.paymentMethod === 'counter' ? 'w-1/4' : 'w-1/3') : 'w-0'}`} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs font-medium text-white/50 px-1 uppercase tracking-wider">
                     {order.paymentMethod === 'counter' && (
                       <span className={order.status === 'awaiting_payment' ? 'text-orange-400' : ''}>Pay</span>
                     )}
                     <span className={order.status === 'pending' ? 'text-yellow-400' : ''}>Pending</span>
                     <span className={order.status === 'preparing' ? 'text-blue-400' : ''}>Preparing</span>
                     <span className={order.status === 'ready' ? 'text-indigo-400' : ''}>Ready</span>
                  </div>
                </div>
              )}

              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <h4 className="text-sm font-semibold text-textMuted mb-3 uppercase tracking-wider">Items in Order</h4>
                <div className="space-y-3">
                  {order.items.map((item, idx) => {
                    const menuItem = menuItems.find(m => m.id === item.menuItemId);
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white/70 w-6">{item.quantity}x</span>
                          <span className="text-white">{menuItem?.name || 'Unknown Item'}</span>
                        </div>
                        <span className="text-white/70">₹{item.price * item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
