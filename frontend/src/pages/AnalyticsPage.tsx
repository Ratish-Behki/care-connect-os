import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Bed, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const patientGrowth = [
  { month: 'Jan', patients: 420 },
  { month: 'Feb', patients: 480 },
  { month: 'Mar', patients: 530 },
  { month: 'Apr', patients: 610 },
  { month: 'May', patients: 590 },
  { month: 'Jun', patients: 720 },
  { month: 'Jul', patients: 810 },
  { month: 'Aug', patients: 780 },
  { month: 'Sep', patients: 850 },
  { month: 'Oct', patients: 920 },
  { month: 'Nov', patients: 980 },
  { month: 'Dec', patients: 1050 },
];

const diseaseTrends = [
  { month: 'Jan', cardiology: 45, neurology: 30, orthopedics: 25, dermatology: 20 },
  { month: 'Feb', cardiology: 52, neurology: 28, orthopedics: 30, dermatology: 22 },
  { month: 'Mar', cardiology: 48, neurology: 35, orthopedics: 28, dermatology: 25 },
  { month: 'Apr', cardiology: 60, neurology: 32, orthopedics: 35, dermatology: 18 },
  { month: 'May', cardiology: 55, neurology: 40, orthopedics: 32, dermatology: 28 },
  { month: 'Jun', cardiology: 65, neurology: 38, orthopedics: 40, dermatology: 30 },
];

const bedOccupancy = [
  { name: 'General', occupied: 78, total: 100 },
  { name: 'ICU', occupied: 18, total: 20 },
  { name: 'Pediatric', occupied: 22, total: 30 },
  { name: 'Maternity', occupied: 12, total: 15 },
  { name: 'Emergency', occupied: 8, total: 10 },
];

const emergencyFrequency = [
  { day: 'Mon', emergencies: 12 },
  { day: 'Tue', emergencies: 8 },
  { day: 'Wed', emergencies: 15 },
  { day: 'Thu', emergencies: 10 },
  { day: 'Fri', emergencies: 18 },
  { day: 'Sat', emergencies: 22 },
  { day: 'Sun', emergencies: 20 },
];

const departmentDistribution = [
  { name: 'Cardiology', value: 30, color: 'hsl(199, 89%, 48%)' },
  { name: 'Neurology', value: 22, color: 'hsl(168, 76%, 42%)' },
  { name: 'Orthopedics', value: 18, color: 'hsl(38, 92%, 50%)' },
  { name: 'Dermatology', value: 15, color: 'hsl(0, 84%, 60%)' },
  { name: 'Pediatrics', value: 15, color: 'hsl(270, 70%, 55%)' },
];

const summaryCards = [
  { icon: Users, label: 'Total Patients', value: '10,248', change: '+12.5%', positive: true },
  { icon: Bed, label: 'Bed Occupancy', value: '82%', change: '+3.2%', positive: false },
  { icon: TrendingUp, label: 'Appointments', value: '1,420', change: '+8.1%', positive: true },
  { icon: AlertTriangle, label: 'Emergencies', value: '105', change: '-5.3%', positive: true },
];

const AnalyticsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Health Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Hospital performance and health trends overview</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <span className={`text-xs font-medium ${card.positive ? 'text-success' : 'text-emergency'}`}>
                  {card.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Growth */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Patient Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={patientGrowth}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 90%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="patients" stroke="hsl(199, 89%, 48%)" fill="url(#colorPatients)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Disease Trends */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Disease Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={diseaseTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 90%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="cardiology" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neurology" stroke="hsl(168, 76%, 42%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="orthopedics" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dermatology" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bed Occupancy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Bed Occupancy</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bedOccupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 90%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="occupied" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} name="Occupied" />
                <Bar dataKey="total" fill="hsl(214, 20%, 90%)" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Emergency Frequency */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Emergency Frequency</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={emergencyFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 90%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="emergencies" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-4">Department Distribution</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={departmentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {departmentDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 90%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 min-w-[160px]">
              {departmentDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-foreground">{d.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
