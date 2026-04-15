import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Ambulance,
  Activity,
  Copy,
  Hospital,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Wifi,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import EmergencyLiveMap from '@/components/EmergencyLiveMap';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { getEmergencySocket, disconnectEmergencySocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import type { EmergencyHospital, EmergencyLocation, EmergencyRequest } from '@/types';

interface EmergencyDispatchState {
  emergency: EmergencyRequest;
  ambulance: { id: string; driver: string; phone: string };
  etaMinutes: number;
}

const captureCurrentLocation = (): Promise<EmergencyLocation> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location services are not available in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser',
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );
  });

const buildDefaultAmbulance = (emergency?: EmergencyRequest | null) => ({
  id: emergency?.assignedAmbulance?.id ?? emergency?.ambulanceId ?? 'A-204',
  driver: emergency?.assignedAmbulance?.driverName ?? 'Raj Kumar',
  phone: emergency?.assignedAmbulance?.phone ?? '+91 98111 22334',
});

const buildDefaultDoctor = (emergency?: EmergencyRequest | null) => ({
  name: emergency?.assignedDoctor?.name ?? 'Doctor assignment pending',
  specialization: emergency?.assignedDoctor?.specialization ?? 'Emergency Medicine',
  phone: emergency?.assignedDoctor?.phone ?? 'Awaiting doctor contact',
});

const EmergencyPage = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? 'patient';
  const shareRole = role === 'patient' ? 'patient' : role === 'ambulance' ? 'ambulance' : null;

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(role === 'patient');
  const [currentLocation, setCurrentLocation] = useState<EmergencyLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState('Finding your location...');
  const [socketStatus, setSocketStatus] = useState('Realtime connection not started yet.');
  const [dispatchInfo, setDispatchInfo] = useState<EmergencyDispatchState | null>(null);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const { toast } = useToast();

  const { data: activeEmergencyPayload } = useQuery({
    queryKey: ['active-emergencies'],
    queryFn: api.getActiveEmergencies,
    enabled: role !== 'patient',
  });

  const { data: emergencyResources } = useQuery({
    queryKey: ['emergency-resources'],
    queryFn: api.getEmergencyResources,
    refetchInterval: 5000,
  });

  const latestActiveEmergency = activeEmergencyPayload?.emergencies?.[0] ?? null;
  const isLiveEmergencyActive = Boolean(activeEmergency ?? latestActiveEmergency);
  const emergency = activeEmergency ?? latestActiveEmergency ?? dispatchInfo?.emergency ?? null;
  const ambulance = buildDefaultAmbulance(emergency);
  const doctor = buildDefaultDoctor(emergency);
  const etaMinutes = dispatchInfo?.etaMinutes ?? emergency?.dispatchMetrics?.ambulanceEtaMinutes ?? emergency?.nearestHospital.etaMinutes ?? 8;
  const availableAmbulances = emergencyResources?.ambulances.filter((entry) => entry.availability === 'available').length ?? 0;
  const availableBeds = emergencyResources?.hospitals.reduce((total, hospital) => total + hospital.availableBeds, 0) ?? 0;
  const availableDoctors = emergencyResources?.doctors.filter((entry) => entry.available).length ?? 0;

  const requestEmergency = useMutation({
    mutationFn: api.requestEmergency,
    onSuccess: ({ emergency: createdEmergency, ambulance: createdAmbulance, etaMinutes: createdEtaMinutes }) => {
      setIsRequesting(false);
      setActiveEmergency(createdEmergency);
      setDispatchInfo({ emergency: createdEmergency, ambulance: createdAmbulance, etaMinutes: createdEtaMinutes });
      setIsSharingLocation(true);
      setSocketStatus('Joining live emergency room...');
      toast({
        title: 'Ambulance Dispatched!',
        description: `Your live location was shared with the ambulance and ${createdEmergency.nearestHospital.name}.`,
      });
    },
    onError: (error: Error) => {
      setIsRequesting(false);
      toast({
        title: 'Emergency request failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    let cancelled = false;

    const initLocation = async () => {
      try {
        setLocationStatus('Requesting precise location permission...');
        const location = await captureCurrentLocation();

        if (!cancelled) {
          setCurrentLocation(location);
          setLocationStatus(`Location locked: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        }
      } catch {
        if (!cancelled) {
          setLocationStatus('Location is not available yet. You can still request SOS with fallback coordinates.');
        }
      }
    };

    void initLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = getEmergencySocket();

    const handleSnapshot = ({ emergency: snapshot }: { emergency: EmergencyRequest }) => {
      setActiveEmergency(snapshot);
      setDispatchInfo((current) => ({
        emergency: snapshot,
        ambulance: current?.ambulance ?? buildDefaultAmbulance(snapshot),
        etaMinutes: snapshot.nearestHospital.etaMinutes ?? current?.etaMinutes ?? 8,
      }));
      setSocketStatus('Live emergency room connected.');
    };

    const handleError = ({ message }: { message?: string }) => {
      setSocketStatus('Live connection error.');
      toast({
        title: 'Realtime connection issue',
        description: message || 'Unable to join the emergency room.',
        variant: 'destructive',
      });
    };

    socket.on('emergency:snapshot', handleSnapshot);
    socket.on('emergency:update', handleSnapshot);
    socket.on('emergency:error', handleError);
    socket.connect();
    setSocketStatus('Connecting to realtime emergency room...');

    return () => {
      socket.off('emergency:snapshot', handleSnapshot);
      socket.off('emergency:update', handleSnapshot);
      socket.off('emergency:error', handleError);
      if (socket.connected) {
        socket.disconnect();
      }
      disconnectEmergencySocket();
    };
  }, [toast]);

  useEffect(() => {
    if (!emergency?.roomId) {
      return;
    }

    const socket = getEmergencySocket();
    socket.emit('emergency:join', {
      emergencyId: emergency.id,
      role,
    });
  }, [emergency?.id, emergency?.roomId, role]);

  useEffect(() => {
    if (!emergency?.id || !shareRole || !isSharingLocation) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser.');
      setIsSharingLocation(false);
      return;
    }

    let watchId: number | null = null;
    let cancelled = false;

    const emitLocation = (location: EmergencyLocation) => {
      const socket = getEmergencySocket();
      setCurrentLocation(location);

      socket.emit(shareRole === 'patient' ? 'emergency:patient-location' : 'emergency:ambulance-location', {
        emergencyId: emergency.id,
        location,
      });
    };

    const startTracking = async () => {
      try {
        setLocationStatus(shareRole === 'patient' ? 'Sharing your live location...' : 'Sharing ambulance location in real time...');
        const initialLocation = await captureCurrentLocation();

        if (cancelled) {
          return;
        }

        emitLocation(initialLocation);

        watchId = navigator.geolocation.watchPosition(
          (position) => {
            emitLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'browser',
            });
          },
          (error) => {
            setLocationStatus(error.message || 'Location tracking paused.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
        );
      } catch (error) {
        if (!cancelled) {
          setLocationStatus(error instanceof Error ? error.message : 'Unable to access location.');
          setIsSharingLocation(false);
        }
      }
    };

    void startTracking();

    return () => {
      cancelled = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [emergency?.id, isSharingLocation, shareRole]);

  useEffect(() => {
    if (role !== 'patient' && latestActiveEmergency && !activeEmergency) {
      setActiveEmergency(latestActiveEmergency);
      setDispatchInfo({
        emergency: latestActiveEmergency,
        ambulance: buildDefaultAmbulance(latestActiveEmergency),
        etaMinutes: latestActiveEmergency.nearestHospital.etaMinutes ?? 8,
      });
      setSocketStatus('Active emergency loaded from backend.');
    }
  }, [activeEmergency, latestActiveEmergency, role]);

  const handleSOS = async () => {
    setIsRequesting(true);

    let locationToShare = currentLocation;

    if (!locationToShare) {
      try {
        locationToShare = await captureCurrentLocation();
        setCurrentLocation(locationToShare);
        setLocationStatus(`Location locked: ${locationToShare.lat.toFixed(4)}, ${locationToShare.lng.toFixed(4)}`);
      } catch {
        setLocationStatus('Using fallback dispatch area because location permission was denied.');
      }
    }

    requestEmergency.mutate({
      location: locationToShare ?? undefined,
      symptoms: symptoms.trim() || undefined,
      patientNote: 'Patient en route. Please keep trauma intake and emergency care team ready.',
    });
  };

  const handleStartSharing = () => {
    if (!emergency?.id) {
      toast({
        title: 'No active emergency',
        description: 'Wait for a patient request to appear.',
        variant: 'destructive',
      });
      return;
    }

    setIsSharingLocation(true);
    setSocketStatus('Starting ambulance location sharing...');
  };

  const handleStopSharing = () => {
    if (!emergency?.id) {
      return;
    }

    setIsSharingLocation(false);
    setSocketStatus('Ambulance location sharing stopped.');
    const socket = getEmergencySocket();
    socket.emit('emergency:complete', { emergencyId: emergency.id });
    setActiveEmergency((current) => (current ? { ...current, status: 'completed' } : current));
  };

  const handleCancelEmergency = () => {
    if (emergency?.id) {
      const socket = getEmergencySocket();
      socket.emit('emergency:complete', { emergencyId: emergency.id });
    }

    setIsSharingLocation(false);
    setActiveEmergency(null);
    setDispatchInfo(null);
    toast({
      title: 'Emergency cleared',
      description: 'The live room has been closed.',
    });
  };

  const handleHospitalReady = () => {
    if (!emergency?.id) {
      return;
    }

    const socket = getEmergencySocket();
    socket.emit('emergency:hospital-ready', { emergencyId: emergency.id });
    toast({
      title: 'Hospital marked ready',
      description: 'Patient and ambulance have been informed that bed and doctor are ready.',
    });
  };

  const openMaps = (hospital?: EmergencyHospital | null) => {
    if (!hospital) {
      return;
    }

    window.open(hospital.directionsUrl, '_blank', 'noopener,noreferrer');
  };

  const screenTitle = role === 'ambulance'
    ? 'Ambulance Dispatch'
    : role === 'hospital'
      ? 'Hospital Handoff'
      : 'Emergency Services';

  const screenDescription = role === 'ambulance'
    ? 'Accept active calls, share your live ambulance location, and follow the patient in realtime.'
    : role === 'hospital'
      ? 'Receive the patient handoff, see the live route, and prepare the bed automatically.'
      : 'Get immediate medical assistance and share your live position with dispatch.';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{screenTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{screenDescription}</p>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3 text-left">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <LocateFixed className="w-4 h-4 text-primary" /> Your location
              </div>
              <p className="text-sm text-muted-foreground break-all">
                {currentLocation ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : locationStatus}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Radio className="w-4 h-4 text-primary" /> Realtime status
              </div>
              <p className="text-sm text-muted-foreground">{socketStatus}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Hospital className="w-4 h-4 text-primary" /> Nearest hospital
              </div>
              <p className="text-sm text-muted-foreground">
                {emergency ? `${emergency.nearestHospital.name} • ${emergency.nearestHospital.address}` : 'Waiting for an emergency session'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-left">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available ambulances</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{availableAmbulances}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available emergency beds</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{availableBeds}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Doctors on standby</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{availableDoctors}</p>
            </div>
          </div>

          {!isLiveEmergencyActive ? (
            <div className="text-center space-y-4">
              {role === 'patient' ? (
                <>
                  <p className="text-sm text-muted-foreground">Tap SOS to share your current location with ambulance dispatch and the nearest hospital.</p>
                  <Textarea
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    placeholder="Describe symptoms for triage routing (e.g., chest pain, breathing issue, head injury)"
                    className="max-w-2xl mx-auto min-h-24"
                  />
                  <button
                    onClick={handleSOS}
                    disabled={isRequesting || requestEmergency.isPending}
                    className={`w-40 h-40 rounded-full gradient-emergency text-primary-foreground flex flex-col items-center justify-center mx-auto shadow-elevated transition-transform ${
                      isRequesting || requestEmergency.isPending ? 'opacity-70' : 'hover:scale-105 animate-pulse-emergency'
                    }`}
                  >
                    <AlertTriangle className="w-10 h-10 mb-2" />
                    <span className="font-display font-bold text-lg">{isRequesting || requestEmergency.isPending ? 'Requesting...' : 'SOS'}</span>
                  </button>
                  <p className="text-xs text-muted-foreground">Emergency number: 911. Your current location will be shared automatically if you allow permission.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No active emergencies are available yet. The next SOS request will appear here automatically.</p>
                  <Button onClick={() => activeEmergencyPayload?.emergencies?.[0] && setActiveEmergency(activeEmergencyPayload.emergencies[0])} variant="outline">
                    <Activity className="w-4 h-4 mr-2" /> Refresh active dispatches
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                  <Ambulance className="w-10 h-10 text-success" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">Live emergency room is active</h2>
                  <p className="text-sm text-muted-foreground mt-1">Estimated ambulance arrival: {etaMinutes} minutes</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="glass-card p-4 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <Ambulance className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Ambulance #{ambulance.id}</p>
                      <p className="text-xs text-muted-foreground">Driver: {ambulance.driver}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">{shareRole === 'ambulance' ? 'Your ambulance is broadcasting live.' : 'Ambulance tracking is live and visible here.'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <p className="text-sm text-primary font-medium">{ambulance.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground break-all">{emergency?.patientLocationMapsUrl}</p>
                  </div>
                </div>

                <div className="glass-card p-4 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <Hospital className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{emergency?.nearestHospital.name}</p>
                      <p className="text-xs text-muted-foreground">{emergency?.nearestHospital.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Distance: {emergency?.dispatchMetrics?.hospitalDistanceKm ?? emergency?.nearestHospital.distanceKm} km • Score: {emergency?.dispatchMetrics?.hospitalScore ?? emergency?.nearestHospital.score ?? 'N/A'} • Bed request sent</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <p className="text-sm text-primary font-medium">{emergency?.nearestHospital.phone}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="glass-card p-4 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Assigned doctor</p>
                      <p className="text-xs text-muted-foreground">{doctor.name} • {doctor.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <p className="text-sm text-primary font-medium">{doctor.phone}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Specialty required: <span className="font-medium text-foreground">{emergency?.requiredSpecialty ?? 'general'}</span> • Severity: <span className="font-medium text-foreground">{emergency?.severity ?? 'moderate'}</span>
                  </div>
                </div>

                <div className="glass-card p-4 text-left space-y-3">
                  <p className="text-sm font-medium text-foreground">Medical snapshot shared with doctor</p>
                  <p className="text-xs text-muted-foreground">Blood group: <span className="text-foreground font-medium">{emergency?.medicalSnapshot?.bloodGroup ?? 'Unavailable'}</span></p>
                  <p className="text-xs text-muted-foreground">Allergies: <span className="text-foreground font-medium">{emergency?.medicalSnapshot?.allergies?.join(', ') || 'None reported'}</span></p>
                  <p className="text-xs text-muted-foreground">Chronic history: <span className="text-foreground font-medium">{emergency?.medicalSnapshot?.diseases?.join(', ') || 'None reported'}</span></p>
                  <p className="text-xs text-muted-foreground">Family notified: <span className="text-foreground font-medium">{emergency?.familyContactNotified ? `Yes (${emergency?.emergencyContact})` : 'Pending'}</span></p>
                </div>
              </div>

              <EmergencyLiveMap
                title={shareRole === 'ambulance' ? 'Ambulance live route' : 'Emergency live tracking'}
                patientLocation={emergency?.location ?? currentLocation}
                ambulanceLocation={emergency?.ambulanceLocation ?? null}
                hospital={emergency?.nearestHospital ?? null}
                patientLocationMapsUrl={emergency?.patientLocationMapsUrl}
              />

              <div className="w-full rounded-xl border border-border/60 bg-muted/40 p-5 space-y-3 text-left">
                <p className="text-sm font-medium text-foreground">Hospital handoff message</p>
                <p className="text-sm text-muted-foreground">{emergency?.handoffMessage}</p>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => openMaps(emergency?.nearestHospital ?? null)}>
                    <Navigation className="w-4 h-4 mr-2" /> Open hospital route
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (emergency?.patientLocationMapsUrl) {
                        void navigator.clipboard.writeText(emergency.patientLocationMapsUrl);
                        toast({ title: 'Patient location copied', description: 'The live patient map link has been copied.' });
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy patient map link
                  </Button>
                  {role === 'ambulance' && (
                    <Button type="button" onClick={isSharingLocation ? handleStopSharing : handleStartSharing}>
                      <Activity className="w-4 h-4 mr-2" /> {isSharingLocation ? 'Stop sharing' : 'Start sharing my location'}
                    </Button>
                  )}
                  {role === 'hospital' && (
                    <Button type="button" onClick={handleHospitalReady}>
                      <Hospital className="w-4 h-4 mr-2" /> Mark hospital ready
                    </Button>
                  )}
                  {role !== 'ambulance' && (
                    <Button type="button" variant="destructive" onClick={handleCancelEmergency}>
                      <AlertTriangle className="w-4 h-4 mr-2" /> End session
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Emergency contacts</h3>
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
