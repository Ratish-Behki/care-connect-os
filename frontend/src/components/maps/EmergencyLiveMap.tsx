import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmergencyHospital, EmergencyLocation } from "@/types";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// =======================
// 🔹 HELPERS
// =======================
function toLatLng(location: EmergencyLocation | null) {
  if (!location) return null;
  return { lat: Number(location.lat), lng: Number(location.lng) };
}

// =======================
// 🔹 FOLLOW PATIENT
// =======================
function FollowPatient({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();
  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    if (position && !hasCentered) {
      map.setView(position, 14);
      setHasCentered(true);
    }
  }, [map, position, hasCentered]);

  return null;
}

function Routing({
  start,
  end,
}: {
  start: { lat: number; lng: number } | null;
  end: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      createMarker: () => null,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, start, end]);

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
  const selectedHospital = hospital;
  const hospitalPoint = useMemo(() => {
    if (!selectedHospital) return null;

    if (
      Number.isFinite(selectedHospital.lat) &&
      Number.isFinite(selectedHospital.lng)
    ) {
      return {
        lat: Number(selectedHospital.lat),
        lng: Number(selectedHospital.lng),
      };
    }

    return toLatLng(selectedHospital.location ?? null);
  }, [selectedHospital]);

  const mapCenter = useMemo(() => {
    return patientPoint || hospitalPoint || null;
  }, [patientPoint, hospitalPoint]);

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

            <Routing start={patientPoint} end={hospitalPoint} />

            <FollowPatient
              position={
                patientPoint
                  ? [patientPoint.lat, patientPoint.lng]
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
