import { motion } from 'framer-motion';
import { Calendar, Clock, X, Video, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { mockAppointments } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const AppointmentsPage = () => {
  const { toast } = useToast();
  const upcoming = mockAppointments.filter((a) => a.status === 'upcoming');
  const past = mockAppointments.filter((a) => a.status !== 'upcoming');

  const handleCancel = (id: string) => {
    toast({ title: 'Appointment cancelled', description: 'Your appointment has been cancelled.' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your scheduled visits</p>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {appt.doctorName.split(' ').pop()?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{appt.doctorName}</h3>
                        <p className="text-xs text-muted-foreground">{appt.specialization}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {appt.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appt.time}</span>
                          <span className="flex items-center gap-1">
                            {appt.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
                            {appt.type === 'video' ? 'Video' : 'In-person'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(appt.id)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Past Appointments</h2>
          <div className="space-y-3">
            {past.map((appt) => (
              <div key={appt.id} className="glass-card p-5 opacity-70">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {appt.doctorName.split(' ').pop()?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{appt.doctorName}</h3>
                    <p className="text-xs text-muted-foreground">{appt.specialization} • {appt.date}</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success capitalize">
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsPage;
