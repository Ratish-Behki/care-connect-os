import { Link, useNavigate, useLocation } from 'react-router-dom';
import { type ComponentType } from 'react';
import { Bell, Heart, LayoutDashboard, Search, Calendar, FileText, AlertTriangle, User, LogOut, BarChart3, Brain, Stethoscope, Ambulance, ShieldCheck, CheckCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import SkipToContent from '@/components/SkipToContent';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@/types';

const navByRole: Record<UserRole, Array<{ icon: ComponentType<{ className?: string }>; label: string; path: string }>> = {
  patient: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Search, label: 'Find Doctors', path: '/doctors' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: FileText, label: 'Records', path: '/records' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Brain, label: 'Symptom Check', path: '/symptom-triage' },
    { icon: AlertTriangle, label: 'Emergency', path: '/emergency' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  doctor: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: FileText, label: 'Records', path: '/records' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Stethoscope, label: 'Doctor View', path: '/doctors' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  ambulance: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Ambulance, label: 'Emergency', path: '/emergency' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  hospital: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Ambulance, label: 'Emergency Handoff', path: '/emergency' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: BarChart3, label: 'Operations', path: '/analytics' },
    { icon: FileText, label: 'Records', path: '/records' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Search, label: 'Doctors', path: '/doctors' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: ShieldCheck, label: 'System', path: '/profile' },
  ],
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const role = user?.role ?? 'patient';
  const navItems = navByRole[role];
  const { data: notificationPayload } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
  });
  const notifications = notificationPayload?.notifications ?? [];
  const unreadCount = notificationPayload?.unreadCount ?? 0;

  const markOne = useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const previewNotifications = notifications.slice(0, 4);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SkipToContent />
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4">
        <Link to="/" className="flex items-center gap-2 px-3 mb-8">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">SmartHospital</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="flex-1 justify-start text-muted-foreground" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm text-foreground">SmartHospital</span>
          </Link>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-emergency px-1 text-[10px] font-semibold text-primary-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <button className="text-xs text-primary" onClick={() => markAll.mutate()} type="button">
                    Mark all read
                  </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {previewNotifications.length === 0 ? (
                  <DropdownMenuItem disabled>No notifications yet</DropdownMenuItem>
                ) : (
                  previewNotifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-2" onSelect={() => markOne.mutate(notification.id)}>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{notification.title}</span>
                        {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">{notification.description}</span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/notifications">View all notifications</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <main id="main-content" className="flex-1 overflow-auto p-6" role="main">
          {children}
        </main>

        <nav className="md:hidden flex items-center justify-around border-t border-border bg-card p-2">
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
