import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, AlertCircle, Pill, Phone, Edit } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  bloodGroup: '',
  allergies: '',
  diseases: '',
  medications: '',
  emergencyContact: '',
};

const ProfilePage = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setForm({
      name: profile.user.name,
      email: profile.user.email,
      phone: profile.health.phone,
      bloodGroup: profile.health.bloodGroup,
      allergies: profile.health.allergies.join(', '),
      diseases: profile.health.diseases.join(', '),
      medications: profile.health.medications.join(', '),
      emergencyContact: profile.health.emergencyContact,
    });
  }, [profile, open]);

  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: ({ user }) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setOpen(false);
      toast({ title: 'Profile updated', description: 'Your profile changes were saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      user: {
        name: form.name,
        email: form.email,
      },
      health: {
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        diseases: form.diseases.split(',').map((item) => item.trim()).filter(Boolean),
        medications: form.medications.split(',').map((item) => item.trim()).filter(Boolean),
        emergencyContact: form.emergencyContact,
        phone: form.phone,
      },
    });
  };

  const infoSections = [
    { icon: Heart, label: 'Blood Group', value: profile?.health.bloodGroup ?? '' },
    { icon: AlertCircle, label: 'Allergies', value: profile?.health.allergies.join(', ') ?? '' },
    { icon: Pill, label: 'Medications', value: profile?.health.medications.join(', ') ?? '' },
    { icon: Phone, label: 'Emergency Contact', value: profile?.health.emergencyContact ?? '' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your health information</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>

        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
              {profile?.user.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{profile?.user.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">DOB: {profile?.health.dateOfBirth} • {profile?.health.phone}</p>
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
            {profile?.health.diseases.map((d) => (
              <span key={d} className="px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-medium">{d}</span>
            ))}
          </div>
        </motion.div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your contact and health details.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Emergency Contact</label>
                <Input value={form.emergencyContact} onChange={(event) => setForm((current) => ({ ...current, emergencyContact: event.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Blood Group</label>
                <Input value={form.bloodGroup} onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Allergies</label>
                <Textarea value={form.allergies} onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))} className="mt-1.5 min-h-24" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Medications</label>
                <Textarea value={form.medications} onChange={(event) => setForm((current) => ({ ...current, medications: event.target.value }))} className="mt-1.5 min-h-24" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Known Conditions</label>
                <Textarea value={form.diseases} onChange={(event) => setForm((current) => ({ ...current, diseases: event.target.value }))} className="mt-1.5 min-h-24" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="gradient-primary text-primary-foreground border-0">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
