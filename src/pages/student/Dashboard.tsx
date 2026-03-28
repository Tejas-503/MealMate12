import { useAppStore } from '../../store/useAppStore';
import { Link } from 'react-router-dom';
import { Calendar, Coffee, ClipboardList, Clock } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, orders, bookings } = useAppStore();
  
  const myRecentOrders = orders.filter(o => o.userId === currentUser?.id).slice(0, 3);
  const activeBookings = bookings.filter(b => b.userId === currentUser?.id && b.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">
            Welcome back, {currentUser?.fullName}!
          </h1>
          <p className="text-textMuted mt-1">What would you like to do today?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/student/booking" className="glass-panel p-6 group hover:border-primary/50 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Book a Seat</h3>
              <p className="text-textMuted text-sm">Reserve your spot in the canteen to save time during breaks.</p>
            </div>
          </div>
        </Link>
        
        <Link to="/student/menu" className="glass-panel p-6 group hover:border-accent/50 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coffee size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Order Food</h3>
              <p className="text-textMuted text-sm">Browse the menu and order fresh meals directly.</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Active Bookings</h2>
            <Link to="/student/booking" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {activeBookings.length === 0 ? (
              <div className="glass-panel p-8 text-center text-textMuted border border-white/5">
                 No active seat bookings right now.
              </div>
            ) : (
              activeBookings.map(booking => (
                <div key={booking.id} className="glass-panel p-4 flex items-center gap-4 border-l-4 border-l-primary">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Seat #{booking.seatNumber}</h4>
                    <p className="text-sm text-textMuted">Slot: {booking.timeSlot} • Date: {booking.bookingDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Link to="/student/orders" className="text-sm text-primary hover:underline">View History</Link>
          </div>
          <div className="space-y-4">
            {myRecentOrders.length === 0 ? (
              <div className="glass-panel p-8 text-center text-textMuted border border-white/5">
                You haven't placed any orders yet.
              </div>
            ) : (
              myRecentOrders.map(order => (
                <div key={order.id} className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-3 rounded-lg text-white/70">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Order {order.id.slice(-6)}</h4>
                      <p className="text-sm text-textMuted">₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-primary/20 text-primary border border-primary/30">
                    {order.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
