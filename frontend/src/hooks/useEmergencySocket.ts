import { useEffect } from "react";
import { emergencySocketService } from "@/services/socket/emergencySocket";
import { useAuthStore } from "@/store/authStore";
import type { EmergencyRequest } from "@/types";

interface UseEmergencySocketOptions {
  onUpdate?: (emergency: EmergencyRequest) => void;
  onError?: (error: string) => void;
}

export const useEmergencySocket = ({
  onUpdate,
  onError,
}: UseEmergencySocketOptions = {}) => {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const socket = emergencySocketService.connect({
      id: user.id,
      role: user.role,
    });

    const handleUpdate = ({ emergency }: { emergency: EmergencyRequest }) => {
      onUpdate?.(emergency);
    };

    const handleError = ({ message }: { message?: string }) => {
      onError?.(message || "Socket error");
    };

    socket.on("emergency:update", handleUpdate);
    socket.on("emergency:error", handleError);

    return () => {
      socket.off("emergency:update", handleUpdate);
      socket.off("emergency:error", handleError);
    };
  }, [user, onUpdate, onError]);
};