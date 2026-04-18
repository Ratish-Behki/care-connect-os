import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Clock, Ambulance, Stethoscope, CalendarCheck, Activity, ArrowRight, Phone, MapPin, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/common/ThemeToggle';
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
    <div className="min-h-screen bg-background text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white shadow-elevated flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="7" width="18" height="12" rx="2" fill="hsl(199 89% 48% / 0.95)" />
                <path d="M12 3v6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display font-semibold text-lg text-foreground">Care Connect Hospital</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <a href="#departments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Departments</a>
            <a href="#doctors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Doctors</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <a href="tel:+18001234567" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="w-4 h-4 text-destructive" /> Emergency: +1 800 123 4567
              </a>
              <Link to="/signup">
                <Button size="sm" className="gradient-primary text-primary-foreground border-0">Get Started</Button>
              </Link>
            </div>
          </div>
          <div className="lg:hidden flex items-center gap-3">
            <Link to="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden gradient-hero">
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
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4">
                Excellence in Care —
                <span className="block text-primary mt-2 text-3xl md:text-4xl font-semibold">Trusted hospital care, 24/7</span>
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
                <a href="tel:+18001234567">
                  <Button size="lg" className="bg-destructive text-destructive-foreground border-0 shadow-elevated">
                    <Phone className="mr-2 w-4 h-4" /> Call Emergency
                  </Button>
                </a>
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

      {/* Departments / Stats */}
      <section id="departments" className="py-16 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">Our Departments</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive specialty care across all major disciplines.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {["Cardiology", "Emergency", "Neurology", "Orthopedics", "Radiology", "Pediatrics", "Oncology", "General Surgery"].map((d, i) => (
              <motion.div key={d} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{d}</h3>
                <p className="text-sm text-muted-foreground">Experienced specialists and modern facilities for {d.toLowerCase()} care.</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors / Team */}
      <section id="doctors" className="py-16 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">Meet Our Medical Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Board-certified doctors and specialists ready to care for you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((n) => (
              <div key={n} className="glass-card p-6 text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl font-semibold text-foreground">Dr</div>
                <h4 className="font-semibold">Dr. Arjun Malhotra</h4>
                <p className="text-sm text-muted-foreground">Cardiology</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button size="sm" variant="ghost">Profile</Button>
                  <Button size="sm">Book</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">Get in touch</h2>
              <p className="text-muted-foreground mb-6 max-w-md">We are here to help 24/7. For emergencies call the number provided above. For appointments and general inquiries, use the form.</p>
              <div className="space-y-4">
                <div className="p-6 glass-card">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Phone className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold">Emergency</p>
                      <p className="text-sm text-muted-foreground">+1 800 123 4567</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 glass-card">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-sm text-muted-foreground">contact@careconnect.example</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 glass-card">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold">Visiting Hours</p>
                      <p className="text-sm text-muted-foreground">Mon–Sun • 8:00 AM – 8:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input className="w-full mt-2 p-3 rounded-md border border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input className="w-full mt-2 p-3 rounded-md border border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <textarea className="w-full mt-2 p-3 rounded-md border border-border h-28" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Send Message</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">© 2026 Care Connect Hospital</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
