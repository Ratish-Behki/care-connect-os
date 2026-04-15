import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Video, Building } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Doctor } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return { label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), value: d.toISOString().split('T')[0] };
});

interface BookingModalProps {
  doctor: Doctor;
  onClose: () => void;
}

const BookingModal = ({ doctor, onClose }: BookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState<'in-person' | 'video'>('in-person');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bookAppointment = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Appointment Booked! ✅',
        description: `${doctor.name} on ${selectedDate} at ${selectedTime}`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleBook = () => {
    if (!selectedTime) return;
    bookAppointment.mutate({
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      date: selectedDate,
      time: selectedTime,
      type: selectedType,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg glass-card p-6 z-10"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-display text-xl font-bold text-foreground mb-1">Book Appointment</h2>
          <p className="text-sm text-muted-foreground mb-6">{doctor.name} • {doctor.specialization}</p>

          {/* Type */}
          <div className="flex gap-3 mb-6">
            {[
              { value: 'in-person' as const, icon: Building, label: 'In-Person' },
              { value: 'video' as const, icon: Video, label: 'Video Call' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedType === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <Calendar className="w-4 h-4" /> Select Date
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDate(d.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDate === d.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4" /> Select Time
            </div>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedTime === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fee */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted mb-6">
            <span className="text-sm text-muted-foreground">Consultation Fee</span>
            <span className="text-lg font-bold text-foreground">${doctor.fee}</span>
          </div>

          <Button
            className="w-full gradient-primary text-primary-foreground border-0"
            disabled={!selectedTime || bookAppointment.isPending}
            onClick={handleBook}
          >
            {bookAppointment.isPending ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;
