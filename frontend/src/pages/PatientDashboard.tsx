import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText, AlertTriangle, Search, Clock, ArrowRight, Activity, Bell, Shield, Stethoscope, Ambulance } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { appointmentService } from '@/services/appointmentService';
import { recordService } from '@/services/recordService';
import { notificationService } from '@/services/notificationService';

const dashboardModes = {
  patient: {
    eyebrow: 'Patient Hub',
    title: 'Your care in one place',
    description: 'Manage visits, records, triage, and urgent help from a single workspace.',
    quickActions: [
      { icon: Search, label: 'Find Doctor', path: '/doctors', color: 'bg-primary/10 text-primary' },
      { icon: Calendar, label: 'Book Appointment', path: '/doctors', color: 'bg-secondary/10 text-secondary' },
      { icon: FileText, label: 'View Records', path: '/records', color: 'bg-warning/10 text-warning' },
      { icon: AlertTriangle, label: 'Emergency SOS', path: '/emergency', color: 'bg-emergency/10 text-emergency' },
    ],
  },
  doctor: {
    eyebrow: 'Doctor Console',
    title: 'Clinical schedule and patient alerts',
    description: 'Review today’s appointments, priority triage, and recent patient activity.',
    quickActions: [
      { icon: Calendar, label: 'Review Schedule', path: '/appointments', color: 'bg-primary/10 text-primary' },
      { icon: Stethoscope, label: 'Patient Directory', path: '/doctors', color: 'bg-secondary/10 text-secondary' },
      { icon: Bell, label: 'Alerts', path: '/notifications', color: 'bg-warning/10 text-warning' },
      { icon: FileText, label: 'Chart Notes', path: '/records', color: 'bg-emergency/10 text-emergency' },
    ],
  },
  ambulance: {
    eyebrow: 'Dispatch Console',
    title: 'Live response coordination',
    description: 'Track emergency requests, response status, and active notifications.',
    quickActions: [
      { icon: Ambulance, label: 'Emergency Queue', path: '/emergency', color: 'bg-emergency/10 text-emergency' },
      { icon: Bell, label: 'Dispatch Alerts', path: '/notifications', color: 'bg-secondary/10 text-secondary' },
      { icon: FileText, label: 'Profile', path: '/profile', color: 'bg-primary/10 text-primary' },
      { icon: AlertTriangle, label: 'Triage', path: '/symptom-triage', color: 'bg-warning/10 text-warning' },
    ],
  },
  hospital: {
    eyebrow: 'Hospital Control',
    title: 'Emergency handoff and bed readiness',
    description: 'Receive emergency location data, prepare the receiving team, and keep the bed board ready.',
    quickActions: [
      { icon: Ambulance, label: 'Emergency Handoff', path: '/emergency', color: 'bg-emergency/10 text-emergency' },
      { icon: Bell, label: 'Notifications', path: '/notifications', color: 'bg-secondary/10 text-secondary' },
      { icon: Shield, label: 'Operations', path: '/analytics', color: 'bg-warning/10 text-warning' },
      { icon: FileText, label: 'Records', path: '/records', color: 'bg-primary/10 text-primary' },
    ],
  },
  admin: {
    eyebrow: 'Admin Command',
    title: 'Hospital operations at a glance',
    description: 'Monitor system health, demand, and service activity across the hospital.',
    quickActions: [
      { icon: Shield, label: 'System Health', path: '/analytics', color: 'bg-primary/10 text-primary' },
      { icon: Bell, label: 'All Notifications', path: '/notifications', color: 'bg-secondary/10 text-secondary' },
      { icon: Calendar, label: 'Scheduling', path: '/appointments', color: 'bg-warning/10 text-warning' },
      { icon: Search, label: 'Doctors', path: '/doctors', color: 'bg-emergency/10 text-emergency' },
    ],
  },
} as const;

const PatientDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'patient';
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAppointments,
  });
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['records'],
    queryFn: recordService.getRecords,
  });
  const { data: notificationPayload } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
  });
  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');
  const notifications = notificationPayload?.notifications ?? [];
  const unreadNotifications = notificationPayload?.unreadCount ?? 0;
  const mode = dashboardModes[role];

  const stats = role === 'patient'
    ? [
        { label: 'Upcoming visits', value: String(upcomingAppointments.length) },
        { label: 'Unread updates', value: String(unreadNotifications) },
        { label: 'Records', value: String(records.length) },
        { label: 'Emergency ready', value: '24/7' },
      ]
    : role === 'doctor'
      ? [
        { label: 'Today\'s visits', value: String(upcomingAppointments.length) },
        { label: 'Unread alerts', value: String(unreadNotifications) },
        { label: 'Patient records', value: String(records.length) },
        { label: 'Avg response', value: '8 min' },
      ]
      : role === 'ambulance'
        ? [
            { label: 'Active dispatches', value: String(upcomingAppointments.length) },
            { label: 'Urgent alerts', value: String(notifications.filter((notification) => notification.priority === 'high').length) },
            { label: 'Unread updates', value: String(unreadNotifications) },
            { label: 'ETA target', value: '8 min' },
          ]
        : role === 'hospital'
          ? [
              { label: 'Incoming handoffs', value: String(notifications.filter((notification) => notification.type === 'emergency').length) },
              { label: 'High alerts', value: String(notifications.filter((notification) => notification.priority === 'high').length) },
              { label: 'Unread updates', value: String(unreadNotifications) },
              { label: 'Bed readiness', value: 'Active' },
            ]
        : [
            { label: 'Live appointments', value: String(upcomingAppointments.length) },
            { label: 'Unread updates', value: String(unreadNotifications) },
            { label: 'Operational alerts', value: String(notifications.filter((notification) => notification.priority === 'high').length) },
            { label: 'System status', value: 'Healthy' },
          ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border border-border/60">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
                {mode.eyebrow}
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {mode.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{mode.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/60 bg-background/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your health overview for today.</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mode.quickActions.map((action, i) => (
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

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Latest Notifications</h2>
            <Link to="/notifications" className="text-sm text-primary hover:underline flex items-center gap-1">
              View inbox <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {notificationPayload ? (
              notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className={`glass-card p-4 border ${notification.read ? 'opacity-75' : 'border-primary/20'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${notification.priority === 'high' ? 'bg-emergency/10 text-emergency' : notification.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-accent text-accent-foreground'}`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {appointmentsLoading ? (
              <div className="glass-card p-8 text-center text-sm text-muted-foreground">Loading appointments...</div>
            ) : upcomingAppointments.length === 0 ? (
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
            {recordsLoading ? (
              <div className="glass-card p-8 text-center text-sm text-muted-foreground">Loading records...</div>
            ) : records.map((record) => (
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
