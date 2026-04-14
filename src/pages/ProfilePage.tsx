import { motion } from 'framer-motion';
import { User, Heart, AlertCircle, Pill, Phone, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/authStore';

const mockProfile = {
  bloodGroup: 'O+',
  allergies: ['Penicillin', 'Peanuts'],
  diseases: ['Mild Hypertension'],
  medications: ['Amlodipine 5mg'],
  emergencyContact: '+1 (555) 987-6543',
  dateOfBirth: '1992-06-15',
  phone: '+1 (555) 123-4567',
};

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);

  const infoSections = [
    { icon: Heart, label: 'Blood Group', value: mockProfile.bloodGroup },
    { icon: AlertCircle, label: 'Allergies', value: mockProfile.allergies.join(', ') },
    { icon: Pill, label: 'Medications', value: mockProfile.medications.join(', ') },
    { icon: Phone, label: 'Emergency Contact', value: mockProfile.emergencyContact },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your health information</p>
          </div>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>

        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">DOB: {mockProfile.dateOfBirth} • {mockProfile.phone}</p>
            </div>
          </div>
        </motion.div>

        {/* Health Info */}
        <div className="grid gap-4 md:grid-cols-2">
          {infoSections.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Diseases */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Known Conditions</h3>
          <div className="flex flex-wrap gap-2">
            {mockProfile.diseases.map((d) => (
              <span key={d} className="px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-medium">{d}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
