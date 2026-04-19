import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { OrderStatus, Order } from '../../types';
import { MapPin, RefreshCcw, CheckCircle2, Clock, PlusCircle, Banknote } from 'lucide-react';

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  awaiting_payment: 'preparing',
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
  completed: null,
  cancelled: null
};

const OrderManager = () => {
  // ✅ THIS FIXES THE INFINITE LOOP
  const orders = useAppStore(state => state.orders);
  const updateOrderStatus = useAppStore(state => state.updateOrderStatus);
  const updateOrderPaymentAndStatus = useAppStore(state => state.updateOrderPaymentAndStatus);
  const menuItems = useAppStore(state => state.menuItems);
  const placeOrder = useAppStore(state => state.placeOrder);
  const currentUser = useAppStore(state => state.currentUser);

  const [filterType, setFilterType] = useState<'all' | 'classroom'>('all');

  // Create a mock order for easy testing
  const handleGenerateTestOrder = async () => {
    if (menuItems.length === 0 || !currentUser) return;
    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    
    const isClassroom = filterType === 'classroom';
    
    await placeOrder(
      currentUser.id,
      [{ menuItemId: randomItem.id, quantity: 1, price: randomItem.price }],
      randomItem.price,
      'razorpay',
      'completed',
      'pending',
      isClassroom ? {
        orderType: 'classroom_delivery',
        orderedBy: 'teacher',
        building: 'Block B',
        roomNumber: '104',
        locationType: 'Classroom',
        notes: 'Near the projector'
      } : undefined
    );
  };

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => ['awaiting_payment', 'pending', 'preparing', 'ready'].includes(o.status));
    
    if (filterType === 'classroom') {
      filtered = filtered.filter(o => o.orderType === 'classroom_delivery');
    }

    return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, filterType]);

  const handleStatusUpdate = (orderId: string, currentStatus: OrderStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (next) {
      if (currentStatus === 'awaiting_payment') {
        updateOrderPaymentAndStatus(orderId, next, 'completed');
      } else {
        updateOrderStatus(orderId, next);
      }
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => activeOrders.filter(o => o.status === status);

  const KanbanColumn = ({
    title,
    ordersList,
    icon: Icon,
    colorClass,
    actionIcon: ActionIcon,
    actionText
  }: {
    title: string;
    status: OrderStatus;
    ordersList: Order[];
    icon: any;
    colorClass: string;
    actionIcon: any;
    actionText: string;
  }) => (
    <div className="flex flex-col h-[700px]">
      <div className={`mb-4 px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between ${colorClass.replace('text-', 'bg-').replace('500', '500/10')}`}>
        <h3 className={`font-bold tracking-wide flex items-center gap-2 ${colorClass}`}>
          <Icon size={18} /> {title}
        </h3>
        <span className="bg-black/20 text-textMain px-2.5 py-1 rounded-md text-xs font-bold">
          {ordersList.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {ordersList.map(order => (
          <div key={order.id} className="glass-panel p-5 border-t-4 hover:-translate-y-1 transition-transform group" style={{ borderTopColor: 'currentColor' }}>
            <div className={`text-${colorClass.split('-')[1]}-500`}>
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-textMain text-lg leading-none">#{order.id.slice(-4)}</span>
                <span className="text-xs text-textMuted flex items-center gap-1">
                  <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Badges for Teachers / Classroom display */}
              {(order.orderedBy === 'teacher' || order.orderType === 'classroom_delivery' || order.orderType === 'seat_delivery') && (
                 <div className="mb-3 flex flex-wrap gap-2">
                    {order.orderedBy === 'teacher' && (
                       <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">👨‍🏫 Teacher</span>
                    )}
                    {order.orderType === 'classroom_delivery' && (
                       <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">📦 Delivery</span>
                    )}
                    {order.orderType === 'seat_delivery' && (
                       <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">🪑 Seat</span>
                    )}
                 </div>
              )}
              
              {order.orderType === 'classroom_delivery' && (
                 <div className="mb-3 text-xs bg-white/5 p-2 rounded border border-white/10 text-white/80">
                    <div className="font-bold mb-1 flex items-center gap-1"><MapPin size={12}/> {order.locationType || 'Location'}: {order.building} {order.roomNumber}</div>
                    {order.notes && <div className="text-white/50 italic wrap-break-word">"{order.notes}"</div>}
                 </div>
              )}

              <div className="bg-black/5 dark:bg-black/30 rounded-lg p-3 mb-4 min-h-[80px]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1">
                    <span className="text-textMain flex items-center gap-2">
                      <span className="font-bold text-primary w-5">{item.quantity}x</span>
                      {menuItems.find(m => m.id === item.menuItemId)?.name || 'Item'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(order.id, order.status)}
                  className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs text-white ${colorClass.replace('text-', 'bg-').replace('400', '600')} hover:shadow-lg hover:brightness-110`}
                >
                  <ActionIcon size={16} /> {actionText}
                </button>
              </div>
            </div>
          </div>
        ))}
        {ordersList.length === 0 && (
          <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-textMuted text-sm">
            No orders
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Active Operations</h1>
          <p className="text-textMuted text-lg">Manage incoming orders through the pipeline.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface border border-white/10 rounded-xl p-1 flex">
            <button 
              onClick={() => setFilterType('all')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
            >
              All Orders
            </button>
            <button 
              onClick={() => setFilterType('classroom')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'classroom' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
            >
              Classroom Orders
            </button>
          </div>
          <button
            onClick={handleGenerateTestOrder}
            className="btn-secondary flex items-center gap-2 text-sm bg-white/5 border-white/10 shrink-0"
          >
            <PlusCircle size={16} /> Test Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KanbanColumn
          title="Awaiting Payment"
          status="awaiting_payment"
          ordersList={getOrdersByStatus('awaiting_payment')}
          icon={Banknote}
          colorClass="text-red-500"
          actionIcon={CheckCircle2}
          actionText="Confirm Paid"
        />
        <KanbanColumn
          title="Pending Queue"
          status="pending"
          ordersList={getOrdersByStatus('pending')}
          icon={Clock}
          colorClass="text-yellow-500"
          actionIcon={RefreshCcw}
          actionText="Start Preparing"
        />
        <KanbanColumn
          title="In Kitchen"
          status="preparing"
          ordersList={getOrdersByStatus('preparing')}
          icon={RefreshCcw}
          colorClass="text-blue-500"
          actionIcon={MapPin}
          actionText="Mark Ready"
        />
        <KanbanColumn
          title="Ready for Pickup"
          status="ready"
          ordersList={getOrdersByStatus('ready')}
          icon={MapPin}
          colorClass="text-indigo-500"
          actionIcon={CheckCircle2}
          actionText="Complete"
        />
      </div>
    </div>
  );
};

export default OrderManager;
