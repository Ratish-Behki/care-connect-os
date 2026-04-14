import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText, AlertTriangle, Search, Clock, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { mockAppointments, mockRecords } from '@/data/mockData';

const quickActions = [
  { icon: Search, label: 'Find Doctor', path: '/doctors', color: 'bg-primary/10 text-primary' },
  { icon: Calendar, label: 'Book Appointment', path: '/doctors', color: 'bg-secondary/10 text-secondary' },
  { icon: FileText, label: 'View Records', path: '/records', color: 'bg-warning/10 text-warning' },
  { icon: AlertTriangle, label: 'Emergency SOS', path: '/emergency', color: 'bg-emergency/10 text-emergency' },
];

const PatientDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const upcomingAppointments = mockAppointments.filter((a) => a.status === 'upcoming');

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your health overview for today.</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={action.path}
                className="glass-card p-4 flex flex-col items-center gap-3 hover:shadow-elevated transition-shadow text-center group"
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Link to="/doctors">
                  <Button size="sm" className="mt-3 gradient-primary text-primary-foreground border-0">Book Now</Button>
                </Link>
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {appt.doctorName.split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{appt.doctorName}</p>
                      <p className="text-xs text-muted-foreground">{appt.specialization}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.time}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{appt.date}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    appt.type === 'video' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {appt.type === 'video' ? '📹 Video' : '🏥 In-person'}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Records */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Medical Records</h2>
            <Link to="/records" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockRecords.map((record) => (
              <div key={record.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center mt-0.5">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{record.diagnosis}</p>
                      <p className="text-xs text-muted-foreground">{record.doctorName} • {record.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
