import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useEmailSuggestions } from '@/hooks/useEmailSuggestions';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const roles: { value: UserRole; label: string; emoji: string }[] = [
  { value: 'patient', label: 'Patient', emoji: '🏥' },
  { value: 'doctor', label: 'Doctor', emoji: '🩺' },
  { value: 'ambulance', label: 'Ambulance', emoji: '🚑' },
  { value: 'hospital', label: 'Hospital', emoji: '🏨' },
  { value: 'admin', label: 'Admin', emoji: '⚙️' },
];

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const { toast } = useToast();
  const { getSuggestions, removeSuggestion } = useEmailSuggestions();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch('email');
  const roleSuggestions = getSuggestions(selectedRole);

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => authService.login({ ...data, role: selectedRole }),
    onSuccess: ({ user, token, profileComplete }) => {
      setSession(user, token);
      // Redirect doctors with incomplete profiles to setup page
      if (selectedRole === 'doctor' && profileComplete === false) {
        navigate('/doctor-profile-setup');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleSuggestionClick = (email: string) => {
    setValue('email', email);
    setShowSuggestions(false);
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
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <div className="glass-card p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setSelectedRole(r.value);
                  setShowSuggestions(false);
                }}
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
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  {...register('email')}
                  id="email"
                  placeholder="you@email.com"
                  className="pl-10"
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {/* Email suggestions dropdown */}
                {showSuggestions && roleSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {roleSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.email}
                          className="flex items-center justify-between px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b border-border last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion.email)}
                            className="flex-1 text-left"
                          >
                            <p className="text-sm text-foreground font-medium truncate">
                              {suggestion.email}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSuggestion(suggestion.email);
                            }}
                            className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                            title="Remove this suggestion"
                          >
                            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input {...register('password')} id="password" type="password" placeholder="••••••" className="pl-10" />
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0">
              {loginMutation.isPending ? 'Signing In...' : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
