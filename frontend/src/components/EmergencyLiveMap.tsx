import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EmergencyHospital, EmergencyLocation } from '@/types';

interface EmergencyLiveMapProps {
  patientLocation: EmergencyLocation | null;
  ambulanceLocation: EmergencyLocation | null;
  hospital: EmergencyHospital | null;
  patientLocationMapsUrl?: string;
  title?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_MAPS_JS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY || '';
let scriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (!GOOGLE_MAPS_JS_API_KEY) {
    return Promise.reject(new Error('Google Maps JS API key is not configured.'));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_JS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function toLatLng(location: EmergencyLocation | null) {
  if (!location) {
    return null;
  }

  return {
    lat: Number(location.lat),
    lng: Number(location.lng),
  };
}

const EmergencyLiveMap = ({ patientLocation, ambulanceLocation, hospital, patientLocationMapsUrl, title = 'Live tracking' }: EmergencyLiveMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const patientMarkerRef = useRef<any>(null);
  const ambulanceMarkerRef = useRef<any>(null);
  const hospitalMarkerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState('Loading live map...');
  const mapCenter = useMemo(() => {
    return toLatLng(patientLocation) || toLatLng(ambulanceLocation) || (hospital ? { lat: hospital.lat, lng: hospital.lng } : null);
  }, [ambulanceLocation, hospital, patientLocation]);

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (!GOOGLE_MAPS_JS_API_KEY) {
        setMapStatus('Google Maps JS API key is not configured.');
        return;
      }

      try {
        await loadGoogleMapsScript();
        if (cancelled || !mapContainerRef.current || !mapCenter) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: mapCenter,
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          });
        }

        setMapStatus('Live map connected.');
      } catch {
        if (!cancelled) {
          setMapStatus('Unable to load Google Maps right now.');
        }
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, [mapCenter]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      return;
    }

    const maps = window.google.maps;
    const bounds = new maps.LatLngBounds();

    const updateMarker = (markerRef: React.MutableRefObject<any>, location: ReturnType<typeof toLatLng>, label: string, color: string) => {
      if (!location) {
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
        return;
      }

      if (!markerRef.current) {
        markerRef.current = new maps.Marker({
          map: mapRef.current,
          position: location,
          title: label,
          label,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10,
          },
        });
      } else {
        markerRef.current.setPosition(location);
      }

      bounds.extend(location);
    };

    updateMarker(patientMarkerRef, toLatLng(patientLocation), 'P', '#2563eb');
    updateMarker(ambulanceMarkerRef, toLatLng(ambulanceLocation), 'A', '#dc2626');
    updateMarker(hospitalMarkerRef, hospital ? { lat: hospital.lat, lng: hospital.lng } : null, 'H', '#16a34a');

    if (patientLocation && ambulanceLocation) {
      const path = [toLatLng(patientLocation), toLatLng(ambulanceLocation)].filter(Boolean);
      if (routeRef.current) {
        routeRef.current.setMap(null);
      }
      routeRef.current = new maps.Polyline({
        path,
        strokeColor: '#dc2626',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapRef.current,
      });
    } else if (routeRef.current) {
      routeRef.current.setMap(null);
      routeRef.current = null;
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 64);
    }
  }, [ambulanceLocation, hospital, patientLocation]);

  const openPatientLocation = () => {
    if (patientLocationMapsUrl) {
      window.open(patientLocationMapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{mapStatus}</p>
        </div>
        <Button variant="outline" type="button" onClick={openPatientLocation} disabled={!patientLocationMapsUrl}>
          <MapPin className="w-4 h-4 mr-2" /> Open patient location
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="font-medium text-foreground mb-1">Patient</p>
          <p className="break-all">
            {patientLocation ? `${patientLocation.lat.toFixed(5)}, ${patientLocation.lng.toFixed(5)}` : 'Waiting for patient signal'}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="font-medium text-foreground mb-1">Ambulance</p>
          <p className="break-all">
            {ambulanceLocation ? `${ambulanceLocation.lat.toFixed(5)}, ${ambulanceLocation.lng.toFixed(5)}` : 'Waiting for ambulance signal'}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="font-medium text-foreground mb-1">Hospital</p>
          <p className="break-all">{hospital ? `${hospital.name} • ${hospital.lat.toFixed(5)}, ${hospital.lng.toFixed(5)}` : 'Hospital pending'}</p>
        </div>
      </div>

      {GOOGLE_MAPS_JS_API_KEY ? (
        <div ref={mapContainerRef} className="h-[360px] rounded-2xl overflow-hidden border border-border/60 bg-muted/30" />
      ) : (
        <div className="h-[360px] rounded-2xl border border-border/60 bg-muted/30 flex items-center justify-center text-center p-6">
          <div className="max-w-md space-y-3">
            <Navigation className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground">Google Maps JS API key is required for the live map.</p>
            <p className="text-xs text-muted-foreground">
              Set VITE_GOOGLE_MAPS_JS_API_KEY to render live patient, ambulance, and hospital markers in the browser.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyLiveMap;
