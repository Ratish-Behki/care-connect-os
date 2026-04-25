import { useEffect, useMemo } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmergencyHospital, EmergencyLocation } from "@/types";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet";

// =======================
// 🔹 HELPERS
// =======================
function toLatLng(location: EmergencyLocation | null) {
  if (!location) return null;
  return { lat: Number(location.lat), lng: Number(location.lng) };
}

// =======================
// 🔹 AUTO FIT BOUNDS
// =======================
function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.setView(valid[0], 15);
      return;
    }

    map.fitBounds(valid as any, { padding: [60, 60] });
  }, [map, points]);

  return null;
}

// =======================
// 🔹 FOLLOW AMBULANCE
// =======================
function FollowAmbulance({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.panTo(position);
    }
  }, [position]);

  return null;
}

// =======================
// 🔹 COMPONENT
// =======================
interface EmergencyLiveMapProps {
  patientLocation: EmergencyLocation | null;
  ambulanceLocation: EmergencyLocation | null;
  hospital: EmergencyHospital | null;
  patientLocationMapsUrl?: string;
  title?: string;
}

const EmergencyLiveMap = ({
  patientLocation,
  ambulanceLocation,
  hospital,
  patientLocationMapsUrl,
  title = "Live tracking",
}: EmergencyLiveMapProps) => {
  const patientPoint = toLatLng(patientLocation);
  const ambulancePoint = toLatLng(ambulanceLocation);
  const hospitalPoint = hospital ? toLatLng(hospital.location) : null;

  const mapCenter = useMemo(() => {
    return (
      patientPoint ||
      ambulancePoint ||
      hospitalPoint ||
      null
    );
  }, [patientPoint, ambulancePoint, hospitalPoint]);

  const points: Array<[number, number]> = [];

  if (patientPoint) points.push([patientPoint.lat, patientPoint.lng]);
  if (ambulancePoint) points.push([ambulancePoint.lat, ambulancePoint.lng]);
  if (hospitalPoint) points.push([hospitalPoint.lat, hospitalPoint.lng]);

  const openPatientLocation = () => {
    if (patientLocationMapsUrl) {
      window.open(patientLocationMapsUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Live map (OpenStreetMap)
          </p>
        </div>

        <Button
          variant="outline"
          onClick={openPatientLocation}
          disabled={!patientLocationMapsUrl}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Open patient location
        </Button>
      </div>

      {/* STATUS CARDS */}
      <div className="grid md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 border rounded-xl">
          <p className="font-medium">Patient</p>
          <p>
            {patientLocation
              ? `${patientLocation.lat.toFixed(5)}, ${patientLocation.lng.toFixed(5)}`
              : "Waiting..."}
          </p>
        </div>

        <div className="p-3 border rounded-xl">
          <p className="font-medium">Ambulance</p>
          <p>
            {ambulanceLocation
              ? `${ambulanceLocation.lat.toFixed(5)}, ${ambulanceLocation.lng.toFixed(5)}`
              : "Waiting..."}
          </p>
        </div>

        <div className="p-3 border rounded-xl">
          <p className="font-medium">Hospital</p>
          <p>
            {hospital
              ? `${hospital.name}`
              : "Pending"}
          </p>
        </div>
      </div>

      {/* MAP */}
      {mapCenter ? (
        <div className="h-[380px] rounded-xl overflow-hidden border">

          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* 📍 Patient */}
            {patientPoint && (
              <CircleMarker
                center={[patientPoint.lat, patientPoint.lng]}
                radius={8}
                pathOptions={{ color: "#2563eb", fillOpacity: 0.9 }}
              >
                <Popup>📍 Patient Location</Popup>
              </CircleMarker>
            )}

            {/* 🚑 Ambulance */}
            {ambulancePoint && (
              <CircleMarker
                center={[ambulancePoint.lat, ambulancePoint.lng]}
                radius={8}
                pathOptions={{ color: "#dc2626", fillOpacity: 0.9 }}
              >
                <Popup>🚑 Ambulance</Popup>
              </CircleMarker>
            )}

            {/* 🏥 Hospital */}
            {hospitalPoint && (
              <CircleMarker
                center={[hospitalPoint.lat, hospitalPoint.lng]}
                radius={8}
                pathOptions={{ color: "#16a34a", fillOpacity: 0.9 }}
              >
                <Popup>🏥 {hospital?.name}</Popup>
              </CircleMarker>
            )}

            {/* 🔴 Route Line */}
            {patientPoint && ambulancePoint && (
              <Polyline
                positions={[
                  [ambulancePoint.lat, ambulancePoint.lng],
                  [patientPoint.lat, patientPoint.lng],
                ]}
                pathOptions={{ color: "#dc2626", weight: 4 }}
              />
            )}

            {/* 📍 Auto fit */}
            <FitBounds points={points} />

            {/* 🚑 Follow ambulance */}
            <FollowAmbulance
              position={
                ambulancePoint
                  ? [ambulancePoint.lat, ambulancePoint.lng]
                  : null
              }
            />
          </MapContainer>
        </div>
      ) : (
        <div className="h-[380px] flex items-center justify-center text-center border rounded-xl">
          <div>
            <Navigation className="mx-auto mb-2" />
            <p>Waiting for location data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyLiveMap;