import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Ambulance,
  Activity,
  Hospital,
  LocateFixed,
  Radio,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EmergencyLiveMap from "../components/maps/EmergencyLiveMap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { emergencyService } from "@/services/emergencyService";
import { emergencySocketService } from "@/services/socket/emergencySocket";
import { useEmergencySocket } from "@/hooks/useEmergencySocket"; // ✅ NEW
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";

import type {
  EmergencyHospital,
  EmergencyLocation,
  EmergencyRequest,
} from "@/types";

// =========================
// 📍 LOCATION HELPER
// =========================
const captureCurrentLocation = (): Promise<EmergencyLocation> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "browser",
        }),
      reject,
      { enableHighAccuracy: true }
    );
  });

const EmergencyPage = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "patient";

  const [currentLocation, setCurrentLocation] =
    useState<EmergencyLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Finding location...");
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [activeEmergency, setActiveEmergency] =
    useState<EmergencyRequest | null>(null);
  const [selectedHospital, setSelectedHospital] =
    useState<EmergencyHospital | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [symptoms, setSymptoms] = useState("");

  const { toast } = useToast();

  // =========================
  // 🔌 SOCKET VIA HOOK
  // =========================
  useEmergencySocket({
    onUpdate: (emergency) => {
      setActiveEmergency(emergency);
      setSocketStatus("Live connected");
    },
    onError: () => {
      setSocketStatus("Error");
    },
  });

  useEffect(() => {
    if (!activeEmergency?.id || !user) return;

    emergencySocketService.joinEmergency(
      activeEmergency.id,
      user.role
    );
  }, [activeEmergency?.id, user]);

  // =========================
  // 📍 INITIAL LOCATION
  // =========================
  useEffect(() => {
    captureCurrentLocation()
      .then((loc) => {
        setCurrentLocation(loc);
        setLocationStatus("Location detected");
      })
      .catch(() => {
        setLocationStatus("Using fallback location");
      });
  }, []);

  // =========================
  // 📡 LIVE LOCATION TRACKING
  // =========================
  useEffect(() => {
    if (!activeEmergency?.id || !isSharingLocation) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: EmergencyLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "live",
        };

        setCurrentLocation(loc);

        if (role === "ambulance") {
          emergencySocketService.sendAmbulanceLocation(
            activeEmergency.id,
            loc
          );
        } else {
          emergencySocketService.sendPatientLocation(
            activeEmergency.id,
            loc
          );
        }
      },
      (error) => {
        console.error("Location error:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeEmergency?.id, isSharingLocation, role]);

  // =========================
  // 🚨 SOS REQUEST
  // =========================
  const requestEmergency = useMutation({
    mutationFn: emergencyService.requestEmergency,
    onSuccess: ({ emergency }) => {
      setActiveEmergency(emergency);
      setIsRequesting(false);
      setIsSharingLocation(true);

      toast({
        title: "🚑 Ambulance Dispatched",
        description: "Live tracking started",
      });
    },
    onError: (err: Error) => {
      setIsRequesting(false);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSOS = async () => {
    if (isRequesting) return;

    setIsRequesting(true);

    let location = currentLocation;

    try {
      if (!location) {
        location = await captureCurrentLocation();
      }
    } catch {
      location = {
        lat: 28.6139,
        lng: 77.2090,
        accuracy: 1000,
        source: "fallback",
      };
    }

    requestEmergency.mutate({
      location,
      symptoms,
    });
  };

  // =========================
  // 🚑 ACCEPT
  // =========================
  const handleAcceptEmergency = () => {
    if (!activeEmergency?.id || !user?.id) return;

    emergencySocketService.acceptEmergency(
      activeEmergency.id,
      user.id
    );

    setIsSharingLocation(true);
  };

  // =========================
  // ❌ CANCEL
  // =========================
  const handleCancel = () => {
    if (!activeEmergency?.id) return;
    if (!window.confirm("Cancel emergency?")) return;

    emergencySocketService.completeEmergency(activeEmergency.id);

    setActiveEmergency(null);
    setIsSharingLocation(false);
  };

  const ambulance = activeEmergency?.assignedAmbulance;
  const hospital = activeEmergency?.nearestHospital;
  const nearbyHospitals = activeEmergency?.nearbyHospitals ??
    (hospital ? [hospital] : []);
  const doctor = activeEmergency?.assignedDoctor;

  useEffect(() => {
    if (!hospital) {
      setSelectedHospital(null);
      return;
    }

    setSelectedHospital((current) => {
      if (!current) return hospital;

      const stillAvailable = nearbyHospitals.find(
        (item) => item.id === current.id
      );

      return stillAvailable || hospital;
    });
  }, [hospital, nearbyHospitals]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* STATUS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <LocateFixed /> {locationStatus}
          </div>
          <div>
            <Radio /> {socketStatus}
          </div>
          <div>
            <Hospital /> {selectedHospital?.name || hospital?.name || "Waiting"}
          </div>
        </div>

        {/* SOS */}
        {!activeEmergency && role === "patient" && (
          <div className="text-center space-y-4">
            <Textarea
              placeholder="Describe symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <button
              onClick={handleSOS}
              disabled={isRequesting}
              className="w-40 h-40 rounded-full bg-red-500 text-white animate-pulse"
            >
              SOS
            </button>

            <p>Emergency number: 112</p>
          </div>
        )}

        {/* LIVE */}
        {activeEmergency && (
          <div className="space-y-4">

            <h2 className="text-xl font-bold">🚑 Emergency Active</h2>

            <p>
              ETA: {selectedHospital?.etaMinutes || hospital?.etaMinutes || "--"} min
            </p>

            <div>
              <Ambulance />
              {ambulance?.driverName || "Waiting for ambulance"}
            </div>

            <div>
              <Activity />
              {doctor?.name || "Doctor not assigned"}
            </div>

            {nearbyHospitals.length > 0 && (
              <div className="p-3 border rounded-xl space-y-2">
                <p className="font-semibold text-sm">🏥 Nearby hospitals</p>

                <div className="grid gap-2">
                  {nearbyHospitals.map((item) => {
                    const isSelected = selectedHospital?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedHospital(item)}
                        className={`text-left p-2 rounded-lg border text-sm transition ${
                          isSelected
                            ? "bg-green-600 text-white border-green-600"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs opacity-80">
                          {(item.distanceKm ?? 0).toFixed(1)} km • {item.etaMinutes ?? "--"} min
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <EmergencyLiveMap
              patientLocation={activeEmergency.location}
              ambulanceLocation={activeEmergency.ambulanceLocation}
              hospital={selectedHospital || hospital}
            />

            <div className="flex gap-3">
              {role === "ambulance" && !isSharingLocation && (
                <Button onClick={handleAcceptEmergency}>
                  Accept Emergency
                </Button>
              )}

              <Button variant="destructive" onClick={handleCancel}>
                End Emergency
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmergencyPage;