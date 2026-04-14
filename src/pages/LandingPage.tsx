import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Clock, Ambulance, Stethoscope, CalendarCheck, Activity, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-hospital.jpg';

const features = [
  { icon: CalendarCheck, title: 'Smart Appointments', description: 'Book and manage appointments with top doctors in seconds.' },
  { icon: Stethoscope, title: 'Expert Doctors', description: 'Access a network of verified specialists across departments.' },
  { icon: Activity, title: 'Health Records', description: 'Your complete medical history, always accessible and secure.' },
  { icon: Ambulance, title: 'Emergency SOS', description: 'One-tap emergency response with real-time ambulance tracking.' },
  { icon: Shield, title: 'Secure & Private', description: 'End-to-end encryption for all your health data.' },
  { icon: Clock, title: '24/7 Support', description: 'Round-the-clock medical assistance whenever you need it.' },
];

const stats = [
  { value: '10K+', label: 'Patients Served' },
  { value: '500+', label: 'Expert Doctors' },
  { value: '50+', label: 'Departments' },
  { value: '99.9%', label: 'Uptime' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">SmartHospital</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground border-0">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden gradient-hero">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
                <Activity className="w-3.5 h-3.5" />
                AI-Powered Healthcare Platform
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Healthcare,{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Reimagined
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Seamless appointments, instant emergency response, and complete health records — all in one intelligent platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-elevated">
                    Start Free <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-border text-foreground">
                  <Phone className="mr-2 w-4 h-4" /> Emergency: 911
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="rounded-2xl overflow-hidden shadow-elevated">
                <img src={heroImage} alt="Modern hospital facility" className="w-full h-80 object-cover" />
              </div>
              {/* Floating card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 glass-card p-4 rounded-xl shadow-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Health Score</p>
                    <p className="text-xs text-muted-foreground">92/100 — Excellent</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-display text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-md mx-auto">A comprehensive healthcare platform designed around your needs.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 hover:shadow-elevated transition-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="gradient-primary rounded-2xl p-12 text-center">
            <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">Join thousands of patients experiencing smarter healthcare.</p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                Create Account <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">© 2026 SmartHospital OS</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
