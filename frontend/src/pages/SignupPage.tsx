import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(100),
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

const roles: { value: UserRole; label: string; emoji: string }[] = [
  { value: 'patient', label: 'Patient', emoji: '🏥' },
  { value: 'doctor', label: 'Doctor', emoji: '🩺' },
  { value: 'ambulance', label: 'Ambulance', emoji: '🚑' },
  { value: 'hospital', label: 'Hospital', emoji: '🏨' },
  { value: 'admin', label: 'Admin', emoji: '⚙️' },
];

const SignupPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupForm) => api.signup({ ...data, role: selectedRole }),
    onSuccess: ({ user }) => {
      setUser(user);
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">SmartHospital</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join our healthcare platform</p>
        </div>

        <div className="glass-card p-8">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                  selectedRole === r.value
                    ? 'bg-primary text-primary-foreground shadow-elevated'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-lg block mb-1">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input {...register('name')} id="name" placeholder="John Doe" className="pl-10" />
              </div>
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input {...register('email')} id="email" placeholder="you@email.com" className="pl-10" />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input {...register('password')} id="password" type="password" placeholder="••••••" className="pl-10" />
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input {...register('confirmPassword')} id="confirmPassword" type="password" placeholder="••••••" className="pl-10" />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0">
              {signupMutation.isPending ? 'Creating Account...' : <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
