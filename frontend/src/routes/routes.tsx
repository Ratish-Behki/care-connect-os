import { Route, Routes } from "react-router-dom";
import RequireAuth from '@/routes/RequireAuth';
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DoctorProfileSetupPage from "@/pages/DoctorProfileSetupPage";
import PatientDashboard from "@/pages/PatientDashboard";
import DoctorsPage from "@/pages/DoctorsPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import RecordsPage from "@/pages/RecordsPage";
import EmergencyPage from "@/pages/EmergencyPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProfilePage from "@/pages/ProfilePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SymptomTriagePage from "@/pages/SymptomTriagePage";
import NotFound from "@/pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/doctor-profile-setup"
        element={
          <RequireAuth>
            <DoctorProfileSetupPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <PatientDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/doctors"
        element={
          <RequireAuth>
            <DoctorsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/appointments"
        element={
          <RequireAuth>
            <AppointmentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/records"
        element={
          <RequireAuth>
            <RecordsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/emergency"
        element={
          <RequireAuth>
            <EmergencyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <NotificationsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <AnalyticsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/symptom-triage"
        element={
          <RequireAuth>
            <SymptomTriagePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
