import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Stethoscope, ArrowRight, Briefcase } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const profileSetupSchema = z.object({
  specialization: z.string().min(2, 'Specialization is required'),
  experience: z.string().or(z.number()).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return Number.isFinite(num) ? num : 0;
  }).refine((val) => val >= 0, 'Experience must be non-negative'),
  department: z.string().min(2, 'Department is required'),
  fee: z.string().or(z.number()).optional().transform((val) => {
    if (!val) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return Number.isFinite(num) ? num : 0;
  }),
  available: z.boolean().default(true),
});

type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

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

const DoctorProfileSetupPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const [showCustomSpecialization, setShowCustomSpecialization] = useState(false);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      available: true,
      fee: 0,
    },
  });

  const setupMutation = useMutation({
    mutationFn: (data: ProfileSetupForm) =>
      api.put('/doctor/profile/complete', data),
    onSuccess: () => {
      toast({
        title: 'Profile Setup Complete!',
        description: 'Your profile has been successfully updated.',
      });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Setup failed',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProfileSetupForm) => {
    setupMutation.mutate(data);
  };

  const watchSpecialization = watch('specialization');
  const watchDepartment = watch('department');

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Complete Your Profile</h1>
          </div>
          <p className="text-muted-foreground">
            Help patients find you by adding your professional details
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Specialization */}
            <div>
              <Label htmlFor="specialization" className="text-foreground font-medium mb-2 block">
                Specialization *
              </Label>
              {!showCustomSpecialization ? (
                <div className="space-y-2">
                  <select
                    {...register('specialization')}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Specialization</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomSpecialization(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    or enter custom specialization
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    {...register('specialization')}
                    placeholder="Enter your specialization"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomSpecialization(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    select from list instead
                  </button>
                </div>
              )}
              {errors.specialization && (
                <p className="text-xs text-destructive mt-1">{errors.specialization.message}</p>
              )}
            </div>

            {/* Experience */}
            <div>
              <Label htmlFor="experience" className="text-foreground font-medium mb-2 block">
                Years of Experience *
              </Label>
              <Input
                {...register('experience')}
                type="number"
                min="0"
                max="70"
                placeholder="e.g., 5"
                id="experience"
              />
              {errors.experience && (
                <p className="text-xs text-destructive mt-1">{errors.experience.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department" className="text-foreground font-medium mb-2 block">
                Department *
              </Label>
              {!showCustomDepartment ? (
                <div className="space-y-2">
                  <select
                    {...register('department')}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomDepartment(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    or enter custom department
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    {...register('department')}
                    placeholder="Enter your department"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomDepartment(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    select from list instead
                  </button>
                </div>
              )}
              {errors.department && (
                <p className="text-xs text-destructive mt-1">{errors.department.message}</p>
              )}
            </div>

            {/* Fee */}
            <div>
              <Label htmlFor="fee" className="text-foreground font-medium mb-2 block">
                Consultation Fee (Optional)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  {...register('fee')}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50"
                  id="fee"
                  className="pl-8"
                />
              </div>
              {errors.fee && (
                <p className="text-xs text-destructive mt-1">{errors.fee.message}</p>
              )}
            </div>

            {/* Availability */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('available')}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                />
                <span className="text-foreground font-medium">I am available to take appointments</span>
              </label>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <Button
                type="submit"
                disabled={setupMutation.isPending}
                className="w-full gradient-primary text-primary-foreground border-0"
              >
                {setupMutation.isPending ? (
                  'Saving Profile...'
                ) : (
                  <>
                    Complete Setup <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You can update these details later in your profile settings
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorProfileSetupPage;
