import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { mockDoctors } from '@/data/mockData';
import BookingModal from '@/components/BookingModal';
import { Doctor } from '@/types';

const specializations = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'General Medicine'];

const DoctorsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  const filtered = mockDoctors.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesSpec = selectedSpec === 'All' || d.specialization === selectedSpec;
    return matchesSearch && matchesSpec;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Find a Doctor</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse our network of specialists</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Specialization pills */}
        <div className="flex flex-wrap gap-2">
          {specializations.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSpec(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedSpec === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Doctor Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                  {doctor.name.split(' ').pop()?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                      <p className="text-xs text-muted-foreground">{doctor.specialization} • {doctor.department}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      doctor.available ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {doctor.available ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" /> {doctor.rating}
                    </span>
                    <span>{doctor.experience} yrs exp</span>
                    <span className="font-medium text-foreground">${doctor.fee}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {doctor.nextAvailable}
                    </span>
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground border-0"
                      disabled={!doctor.available}
                      onClick={() => setBookingDoctor(doctor)}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No doctors found matching your criteria.</p>
          </div>
        )}
      </div>

      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}
    </DashboardLayout>
  );
};

export default DoctorsPage;
