import { getEmergencySocket, disconnectEmergencySocket } from "@/lib/socket";
import type { EmergencyLocation, UserRole } from "@/types";

let socketInstance: ReturnType<typeof getEmergencySocket> | null = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = getEmergencySocket();
  }
  return socketInstance;
};

export const emergencySocketService = {

  connect(user?: { id: string; role: UserRole }) {
    const socket = getSocket();

    if (!socket.connected) {
      // attach user info
      socket.auth = {
        userId: user?.id,
        role: user?.role,
      };

      socket.connect();
    }

    return socket;
  },

  disconnect() {
    if (socketInstance?.connected) {
      socketInstance.disconnect();
    }
    socketInstance = null;
    disconnectEmergencySocket();
  },

  // 🔥 JOIN ROOM
  joinEmergency(emergencyId: string, role: UserRole) {
    const socket = getSocket();
    socket.emit("emergency:join", { emergencyId, role });
  },

  // 📍 PATIENT LOCATION
  sendPatientLocation(emergencyId: string, location: EmergencyLocation) {
    const socket = getSocket();
    socket.emit("emergency:patient-location", { emergencyId, location });
  },

  // 🚑 AMBULANCE LOCATION
  sendAmbulanceLocation(emergencyId: string, location: EmergencyLocation) {
    const socket = getSocket();
    socket.emit("emergency:ambulance-location", {
      emergencyId,
      location,
    });
  },

  // 🚑 ACCEPT REQUEST
  acceptEmergency(emergencyId: string, ambulanceId: string) {
    const socket = getSocket();
    socket.emit("emergency:accept", { emergencyId, ambulanceId });
  },

  // ❌ COMPLETE
  completeEmergency(emergencyId: string) {
    const socket = getSocket();
    socket.emit("emergency:complete", { emergencyId });
  },

  // 📡 LISTEN
  onEmergencyUpdate(callback: (data: any) => void) {
    const socket = getSocket();
    socket.on("emergency:update", callback);
  },

  offEmergencyUpdate(callback: (data: any) => void) {
    const socket = getSocket();
    socket.off("emergency:update", callback);
  },
};