import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, AlertCircle, Pill, Phone, Edit, Briefcase, Award, Building2, DollarSign } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

const emptyPatientForm = {
  name: '',
  email: '',
  phone: '',
  bloodGroup: '',
  allergies: '',
  diseases: '',
  medications: '',
  emergencyContact: '',
  dateOfBirth: '',
};

const emptyDoctorForm = {
  name: '',
  email: '',
  specialization: '',
  experience: '',
  department: '',
  fee: '',
  available: true,
};

const specializations = [
  'General Practice',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Dermatology',
  'ENT',
  'Ophthalmology',
  'Gynecology',
  'Urology',
  'Gastroenterology',
  'Pulmonology',
];

const departments = [
  'General',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Emergency',
  'ICU',
  'Surgery',
];

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });
  const [open, setOpen] = useState(false);
  type DoctorForm = typeof emptyDoctorForm;
  type PatientForm = typeof emptyPatientForm;
  const [doctorForm, setDoctorForm] = useState<DoctorForm>(emptyDoctorForm);
  const [patientForm, setPatientForm] = useState<PatientForm>(emptyPatientForm);
  const isDoctor = user?.role === 'doctor';

  const getForm = (key: string) => (isDoctor ? (doctorForm as any)[key] : (patientForm as any)[key]);
  const setFormValue = (key: string, value: any) => {
    if (isDoctor) setDoctorForm((d) => ({ ...d, [key]: value }));
    else setPatientForm((p) => ({ ...p, [key]: value }));
  };
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Calculate profile completion
  useEffect(() => {
    if (!profile) return;

    let completed = 0;
    let total = 0;

    if (user?.role === 'doctor') {
      const doctorFields = ['specialization', 'experience', 'department'];
      const basicFields = ['name', 'email'];
      
      doctorFields.forEach(field => {
        total++;
        if (profile.profile?.[field]) completed++;
      });
      basicFields.forEach(field => {
        total++;
        if (profile.user?.[field]) completed++;
      });
    } else {
      const patientFields = ['bloodGroup', 'emergencyContact', 'phone'];
      const basicFields = ['name', 'email'];
      
      patientFields.forEach(field => {
        total++;
        if (profile.profile?.[field]) completed++;
      });
      basicFields.forEach(field => {
        total++;
        if (profile.user?.[field]) completed++;
      });
    }

    if (total > 0) {
      setCompletionPercentage(Math.round((completed / total) * 100));
    }
  }, [profile, user?.role]);

  // Pre-fill form
  useEffect(() => {
    if (!profile) return;

    if (user?.role === 'doctor') {
      setDoctorForm({
        name: profile.user?.name || '',
        email: profile.user?.email || '',
        specialization: profile.profile?.specialization || '',
        experience: profile.profile?.experience?.toString() || '',
        department: profile.profile?.department || '',
        fee: profile.profile?.fee?.toString() || '',
        available: profile.profile?.available ?? true,
      });
    } else {
      setPatientForm({
        name: profile.user?.name || '',
        email: profile.user?.email || '',
        phone: profile.profile?.phone || '',
        bloodGroup: profile.profile?.bloodGroup || '',
        allergies: Array.isArray(profile.profile?.allergies)
          ? profile.profile.allergies.join(', ')
          : '',
        diseases: Array.isArray(profile.profile?.diseases)
          ? profile.profile.diseases.join(', ')
          : '',
        medications: Array.isArray(profile.profile?.medications)
          ? profile.profile.medications.join(', ')
          : '',
        emergencyContact: profile.profile?.emergencyContact || '',
        dateOfBirth: profile.profile?.dateOfBirth || '',
      });
    }
  }, [profile, open, user?.role]);

  const updateMutation = useMutation<any, Error, any>({
    mutationFn: (data: any) => profileService.updateProfile(data),
    onSuccess: ({ user: updatedUser }) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setOpen(false);
      toast({ 
        title: 'Profile updated', 
        description: 'Your changes have been saved successfully.' 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Update failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSaveDoctorProfile = () => {
    // Validation
    if (!doctorForm.specialization?.trim()) {
      toast({ title: 'Validation error', description: 'Specialization is required', variant: 'destructive' });
      return;
    }
    if (!doctorForm.experience?.trim()) {
      toast({ title: 'Validation error', description: 'Experience is required', variant: 'destructive' });
      return;
    }
    if (!doctorForm.department?.trim()) {
      toast({ title: 'Validation error', description: 'Department is required', variant: 'destructive' });
      return;
    }

    updateMutation.mutate({
      user: {
        name: doctorForm.name,
        email: doctorForm.email,
      },
      doctor: {
        specialization: doctorForm.specialization,
        experience: parseInt(doctorForm.experience) || 0,
        department: doctorForm.department,
        fee: parseFloat(doctorForm.fee) || 0,
        available: doctorForm.available,
      },
    });
  };

  const handleSavePatientProfile = () => {
    updateMutation.mutate({
      user: {
        name: patientForm.name,
        email: patientForm.email,
      },
      profile: {
        bloodGroup: patientForm.bloodGroup,
        allergies: patientForm.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        diseases: patientForm.diseases.split(',').map((item) => item.trim()).filter(Boolean),
        medications: patientForm.medications.split(',').map((item) => item.trim()).filter(Boolean),
        emergencyContact: patientForm.emergencyContact,
        phone: patientForm.phone,
        dateOfBirth: patientForm.dateOfBirth,
      },
    });
  };

  const CompletionIndicator = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Profile Completion</span>
        <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full gradient-primary"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === 'doctor' ? 'Manage your professional information' : 'Manage your health information'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        </div>

        {/* Profile Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <CompletionIndicator />
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-foreground font-medium">{profile?.user?.name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">{profile?.user?.email || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {user?.role === 'doctor' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Specialization</p>
                    <p className="text-foreground font-medium">{profile?.profile?.specialization || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-foreground font-medium">{profile?.profile?.experience ? `${profile.profile.experience} years` : '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-foreground font-medium">{profile?.profile?.department || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Consultation Fee</p>
                    <p className="text-foreground font-medium">${profile?.profile?.fee || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patient-specific fields */}
          {user?.role === 'patient' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Health Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground font-medium">{profile?.profile?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Group</p>
                    <p className="text-foreground font-medium">{profile?.profile?.bloodGroup || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Allergies</p>
                    <p className="text-foreground font-medium">{profile?.profile?.allergies?.join(', ') || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Pill className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Medications</p>
                    <p className="text-foreground font-medium">{profile?.profile?.medications?.join(', ') || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                {user?.role === 'doctor' 
                  ? 'Update your professional information' 
                  : 'Update your personal and health information'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <Input
                      value={getForm('name')}
                      onChange={(e) => setFormValue('name', e.target.value)}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      value={getForm('email')}
                      onChange={(e) => setFormValue('email', e.target.value)}
                      type="email"
                      placeholder="john@example.com"
                      className="mt-1"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Doctor Fields */}
              {user?.role === 'doctor' && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Professional Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">Specialization *</label>
                      <select
                        value={getForm('specialization')}
                        onChange={(e) => setFormValue('specialization', e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Specialization</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Years of Experience *</label>
                      <Input
                        value={getForm('experience')}
                        onChange={(e) => setFormValue('experience', e.target.value)}
                        type="number"
                        min="0"
                        placeholder="5"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Department *</label>
                      <select
                        value={getForm('department')}
                        onChange={(e) => setFormValue('department', e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Consultation Fee</label>
                      <Input
                        value={getForm('fee')}
                        onChange={(e) => setFormValue('fee', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="50"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={getForm('available')}
                        onChange={(e) => setFormValue('available', e.target.checked)}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                      <label className="text-sm font-medium text-foreground cursor-pointer">
                        Available for appointments
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Fields */}
              {user?.role === 'patient' && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Health Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">Phone</label>
                      <Input
                        value={getForm('phone')}
                        onChange={(e) => setFormValue('phone', e.target.value)}
                        type="tel"
                        placeholder="+1 234 567 8900"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Blood Group</label>
                      <Input
                        value={getForm('bloodGroup')}
                        onChange={(e) => setFormValue('bloodGroup', e.target.value)}
                        placeholder="O+"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Allergies (comma-separated)</label>
                      <Textarea
                        value={getForm('allergies')}
                        onChange={(e) => setFormValue('allergies', e.target.value)}
                        placeholder="e.g., Penicillin, Peanuts"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Medications (comma-separated)</label>
                      <Textarea
                        value={getForm('medications')}
                        onChange={(e) => setFormValue('medications', e.target.value)}
                        placeholder="e.g., Aspirin 100mg, Vitamin D 1000IU"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Emergency Contact</label>
                      <Input
                        value={getForm('emergencyContact')}
                        onChange={(e) => setFormValue('emergencyContact', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={user?.role === 'doctor' ? handleSaveDoctorProfile : handleSavePatientProfile}
                  disabled={updateMutation.isPending}
                  className="gradient-primary text-primary-foreground border-0"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
