import { useEffect, useMemo } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EmergencyHospital, EmergencyLocation } from '@/types';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet';

interface EmergencyLiveMapProps {
  patientLocation: EmergencyLocation | null;
  ambulanceLocation: EmergencyLocation | null;
  hospital: EmergencyHospital | null;
  patientLocationMapsUrl?: string;
  title?: string;
}

function toLatLng(location: EmergencyLocation | null) {
  if (!location) return null;
  return { lat: Number(location.lat), lng: Number(location.lng) };
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView(valid[0], 15);
      return;
    }
    map.fitBounds(valid as any, { padding: [64, 64] });
  }, [map, points]);
  return null;
}

const EmergencyLiveMap = ({ patientLocation, ambulanceLocation, hospital, patientLocationMapsUrl, title = 'Live tracking' }: EmergencyLiveMapProps) => {
  const mapCenter = useMemo(() => {
    return toLatLng(patientLocation) || toLatLng(ambulanceLocation) || (hospital ? { lat: hospital.lat, lng: hospital.lng } : null);
  }, [ambulanceLocation, hospital, patientLocation]);

  const points: Array<[number, number]> = [];
  const patientPoint = toLatLng(patientLocation);
  const ambulancePoint = toLatLng(ambulanceLocation);
  const hospitalPoint = hospital ? { lat: hospital.lat, lng: hospital.lng } : null;

  if (patientPoint) points.push([patientPoint.lat, patientPoint.lng]);
  if (ambulancePoint) points.push([ambulancePoint.lat, ambulancePoint.lng]);
  if (hospitalPoint) points.push([hospitalPoint.lat, hospitalPoint.lng]);

  const openPatientLocation = () => {
    if (patientLocationMapsUrl) window.open(patientLocationMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">Live map (OpenStreetMap + Leaflet)</p>
        </div>
        <Button variant="outline" type="button" onClick={openPatientLocation} disabled={!patientLocationMapsUrl}>
          <MapPin className="w-4 h-4 mr-2" /> Open patient location
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="font-medium text-foreground mb-1">Patient</p>
          <p className="break-all">{patientLocation ? `${patientLocation.lat.toFixed(5)}, ${patientLocation.lng.toFixed(5)}` : 'Waiting for patient signal'}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="font-medium text-foreground mb-1">Ambulance</p>
          <p className="break-all">{ambulanceLocation ? `${ambulanceLocation.lat.toFixed(5)}, ${ambulanceLocation.lng.toFixed(5)}` : 'Waiting for ambulance signal'}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="font-medium text-foreground mb-1">Hospital</p>
          <p className="break-all">{hospital ? `${hospital.name} • ${hospital.lat.toFixed(5)}, ${hospital.lng.toFixed(5)}` : 'Hospital pending'}</p>
        </div>
      </div>

      {mapCenter ? (
        <div className="h-[360px] rounded-2xl overflow-hidden border border-border/60 bg-muted/30">
          <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {patientPoint && <CircleMarker center={[patientPoint.lat, patientPoint.lng]} radius={8} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9 }} />}
            {ambulancePoint && <CircleMarker center={[ambulancePoint.lat, ambulancePoint.lng]} radius={8} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 }} />}
            {hospitalPoint && <CircleMarker center={[hospitalPoint.lat, hospitalPoint.lng]} radius={8} pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.9 }} />}
            {patientPoint && ambulancePoint && <Polyline positions={[[patientPoint.lat, patientPoint.lng], [ambulancePoint.lat, ambulancePoint.lng]]} pathOptions={{ color: '#dc2626' }} />}
            <FitBounds points={points} />
          </MapContainer>
        </div>
      ) : (
        <div className="h-[360px] rounded-2xl border border-border/60 bg-muted/30 flex items-center justify-center text-center p-6">
          <div className="max-w-md space-y-3">
            <Navigation className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground">Live map not available.</p>
            <p className="text-xs text-muted-foreground">Waiting for location data to appear.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyLiveMap;
