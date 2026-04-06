import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { TimeSlot } from '../../types';
import { Calendar, Users } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const TIME_SLOTS: { label: string; value: TimeSlot }[] = [
  { label: 'Breakfast (9-12)', value: '9-12' },
  { label: 'Lunch (1-3)', value: '1-3' },
  { label: 'Evening Snacks (4-5:30)', value: '4-5:30' }
];

const SeatOversight = () => {
  const { bookings, cancelBooking } = useAppStore();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('1-3');
  const [date] = useState(format(new Date(), 'yyyy-MM-dd'));

  const activeBookings = bookings.filter(b => b.timeSlot === selectedSlot && b.bookingDate === date && b.status === 'active');

  const totalSeats = 30;
  const occupancyRate = Math.round((activeBookings.length / totalSeats) * 100);

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seat Oversight</h1>
        <p className="text-textMuted">Monitor canteen occupancy for today: {format(new Date(date), 'MMMM do, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Select Slot
            </h3>
            <div className="space-y-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot.value}
                  onClick={() => setSelectedSlot(slot.value)}
                  className={clsx(
                    "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    selectedSlot === slot.value
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-surface text-textMuted hover:bg-white/5 hover:text-white border border-white/5"
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users size={20} className="text-accent" /> Occupancy
            </h3>
            <div className="mb-2 flex justify-between items-end">
              <span className="text-3xl font-bold">{occupancyRate}%</span>
              <span className="text-textMuted text-sm mb-1">{activeBookings.length} / {totalSeats} seats</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full transition-all duration-1000",
                  occupancyRate > 80 ? "bg-red-500" : occupancyRate > 50 ? "bg-yellow-400" : "bg-green-400"
                )}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {/* Canteen Map Replica for Staff */}
          <div className="glass-panel p-8">
            <div className="w-full max-w-2xl mx-auto bg-surface border-b border-x border-white/10 h-12 rounded-b-2xl flex items-center justify-center mb-12 shadow-md relative">
              <span className="absolute -top-3 bg-primary/20 text-primary border border-primary/30 px-4 text-xs font-bold uppercase tracking-widest rounded">Counter</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-6 justify-content-center max-w-2xl mx-auto">
              {Array.from({ length: totalSeats }).map((_, i) => {
                const seatNo = i + 1;
                const booking = activeBookings.find(b => b.seatNumber === seatNo);
                const isBooked = !!booking;
                
                const handleSeatClick = () => {
                  if (isBooked && booking) {
                    if (window.confirm(`Are you sure you want to cancel the booking for Seat ${seatNo}?`)) {
                      cancelBooking(booking.id);
                    }
                  }
                };

                return (
                  <div
                    key={seatNo}
                    onClick={handleSeatClick}
                    title={isBooked ? `Booked by User ID: ${booking.userId} (Click to Cancel)` : `Seat ${seatNo} Available`}
                    className={clsx(
                      "aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-sm transition-all duration-300 relative group",
                      isBooked
                        ? "bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] cursor-pointer hover:bg-red-500/40"
                        : "bg-surface text-white/40 border border-white/5 cursor-default"
                    )}
                  >
                    {isBooked ? (
                      <Users size={16} className="mb-1 opacity-80" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-white/10 mb-1" />
                    )}
                    {seatNo}

                    {/* Tooltip */}
                    {isBooked && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                        ID: {booking.userId.slice(-4)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-white/50"><div className="w-4 h-4 rounded bg-surface border border-white/5"></div> Available</div>
              <div className="flex items-center gap-2 text-red-400"><div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center"><Users size={10} /></div> Occupied</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatOversight;
