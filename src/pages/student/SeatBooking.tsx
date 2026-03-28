import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { TimeSlot } from '../../types';
import { Info, Check, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const TIME_SLOTS: { label: string; value: TimeSlot; desc: string }[] = [
  { label: 'Breakfast', value: '9-12', desc: '9:00 AM - 12:00 PM' },
  { label: 'Lunch', value: '1-3', desc: '1:00 PM - 3:00 PM' },
  { label: 'Evening Snacks', value: '4-5:30', desc: '4:00 PM - 5:30 PM' }
];

const SeatBooking = () => {
  const { currentUser, bookings, bookSeat } = useAppStore();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('1-3');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [date] = useState(format(new Date(), 'yyyy-MM-dd')); // Today

  // Determine booked seats for the selected slot and date
  const bookedSeats = bookings
    .filter(b => b.timeSlot === selectedSlot && b.bookingDate === date && b.status === 'active')
    .map(b => b.seatNumber);

  const myBookedSeats = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'active');
  const alreadyBookedCurrentSlot = myBookedSeats.find(b => b.timeSlot === selectedSlot && b.bookingDate === date);

  const handleBooking = () => {
    if (!selectedSeat || !currentUser) return;
    bookSeat(currentUser.id, selectedSeat, selectedSlot, date);
    setSelectedSeat(null);
  };

  const totalSeats = 30;

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-8 items-end justify-between md:flex">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reserve a Seat</h1>
          <p className="text-textMuted">Select a time slot and pick your preferred seat in the canteen.</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 inline-block">
             Date: {format(new Date(date), 'MMMM do, yyyy')}
          </p>
        </div>
      </div>

      {/* Time Slot Selector */}
      <div className="flex gap-2 p-1 bg-surface border border-white/10 rounded-xl mb-8 w-full md:w-fit mx-auto lg:mx-0">
        {TIME_SLOTS.map(slot => (
          <button
            key={slot.value}
            onClick={() => { setSelectedSlot(slot.value); setSelectedSeat(null); }}
            className={clsx(
              "flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedSlot === slot.value 
                ? "bg-primary text-white shadow-md" 
                : "text-textMuted hover:text-white hover:bg-white/5"
            )}
          >
            <div className="block">{slot.label}</div>
            <div className="text-xs opacity-70 font-normal">{slot.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2">
          {/* Canteen Layout */}
          <div className="glass-panel p-6 relative overflow-x-auto">
            {/* Canteen Counter */}
            <div className="w-full bg-surface border-b border-x border-white/10 h-16 rounded-b-3xl flex flex-col items-center justify-center mb-16 shadow-lg shadow-black/50 relative">
               <div className="absolute -top-6 bg-primary/20 text-primary border border-primary/30 px-6 py-1 rounded-t-xl text-sm font-bold uppercase tracking-widest">
                  Food Counter
               </div>
               <p className="text-white/50 text-sm tracking-wide">Pick up orders here</p>
            </div>

            {/* Seat Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-4 sm:gap-6 justify-content-center max-w-lg mx-auto">
              {Array.from({ length: totalSeats }).map((_, i) => {
                const seatNo = i + 1;
                const isBooked = bookedSeats.includes(seatNo);
                const isSelected = selectedSeat === seatNo;
                
                return (
                  <button
                    key={seatNo}
                    disabled={isBooked || !!alreadyBookedCurrentSlot}
                    onClick={() => setSelectedSeat(seatNo)}
                    className={clsx(
                      "group relative aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-sm transition-all duration-300",
                      isBooked 
                        ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" 
                        : isSelected
                          ? "bg-primary text-white shadow-lg shadow-primary/40 scale-110 border border-primary/50 z-10"
                          : "bg-surface text-white/70 hover:bg-white/10 hover:text-white border border-white/10 hover:border-primary/50 shadow-sm"
                    )}
                  >
                    {isBooked ? (
                      <div className="w-4 h-4 rounded-full bg-red-500/80 mb-1" />
                    ) : isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-white mb-1 shadow-[0_0_10px_white]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-accent/50 mb-1 group-hover:bg-accent transition-colors" />
                    )}
                    {seatNo}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-1 border-l-0 lg:border-l border-white/10 lg:pl-8 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Info size={20} className="text-primary" /> Booking Summary
            </h3>
            
            {alreadyBookedCurrentSlot ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-start gap-3">
                <Check size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Seat Confirmed</p>
                  <p className="text-xs opacity-80 mt-1">You have already booked Seat #{alreadyBookedCurrentSlot.seatNumber} for the {TIME_SLOTS.find(t=>t.value===selectedSlot)?.label} slot.</p>
                </div>
              </div>
            ) : selectedSeat ? (
              <div className="animate-fade-in space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-textMuted text-sm">Selected Seat</span>
                  <span className="font-bold text-lg text-white">#{selectedSeat}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-textMuted text-sm">Time Slot</span>
                  <span className="font-semibold text-white">{TIME_SLOTS.find(t=>t.value===selectedSlot)?.label}</span>
                </div>
                <button onClick={handleBooking} className="btn-primary w-full mt-4 py-3">
                  Confirm Reservation
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar size={24} className="opacity-50" />
                </div>
                <p className="text-sm">Select an available seat from the layout to book.</p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6">
             <h4 className="font-semibold text-sm text-textMuted mb-3 uppercase tracking-wider">Legend</h4>
             <div className="space-y-3 mt-2 text-sm text-white/80">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-lg bg-surface border border-white/10 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-accent/50"></div></div>
                   <span>Available</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div></div>
                   <span className="text-white/50">Occupied</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-lg bg-primary border border-primary flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white]"></div></div>
                   <span className="text-primary font-medium">Selected</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;
