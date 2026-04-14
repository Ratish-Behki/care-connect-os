import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, MapPin, Ambulance } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const EmergencyPage = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const { toast } = useToast();

  const handleSOS = () => {
    setIsRequesting(true);
    setTimeout(() => {
      setIsRequesting(false);
      setEmergencyActive(true);
      toast({
        title: '🚑 Ambulance Dispatched!',
        description: 'An ambulance is on its way. ETA: 8 minutes.',
      });
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Emergency Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Get immediate medical assistance</p>
        </div>

        {/* SOS Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          {!emergencyActive ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">Tap the button below for immediate emergency assistance</p>
              <button
                onClick={handleSOS}
                disabled={isRequesting}
                className={`w-40 h-40 rounded-full gradient-emergency text-primary-foreground flex flex-col items-center justify-center mx-auto shadow-elevated transition-transform ${
                  isRequesting ? 'opacity-70' : 'hover:scale-105 animate-pulse-emergency'
                }`}
              >
                <AlertTriangle className="w-10 h-10 mb-2" />
                <span className="font-display font-bold text-lg">{isRequesting ? 'Requesting...' : 'SOS'}</span>
              </button>
              <p className="text-xs text-muted-foreground mt-6">This will share your location and request an ambulance</p>
            </>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Ambulance className="w-10 h-10 text-success" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Help is on the way!</h2>
                <p className="text-sm text-muted-foreground mt-1">Estimated arrival: 8 minutes</p>
              </div>

              <div className="glass-card p-4 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <Ambulance className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Ambulance #A-204</p>
                    <p className="text-xs text-muted-foreground">Driver: Raj Kumar</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">2.3 km away • Moving towards you</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <p className="text-sm text-primary font-medium">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="w-full h-48 rounded-xl bg-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground">🗺️ Live map tracking (requires backend)</p>
              </div>

              <Button variant="outline" className="border-destructive text-destructive" onClick={() => setEmergencyActive(false)}>
                Cancel Emergency
              </Button>
            </div>
          )}
        </motion.div>

        {/* Emergency contacts */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Emergency Contacts</h3>
          <div className="space-y-3">
            {[
              { label: 'Emergency Services', number: '911' },
              { label: 'Hospital Helpline', number: '+1 (555) 000-1234' },
              { label: 'Poison Control', number: '+1 (800) 222-1222' },
            ].map((c) => (
              <div key={c.number} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{c.label}</span>
                <a href={`tel:${c.number}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {c.number}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmergencyPage;
