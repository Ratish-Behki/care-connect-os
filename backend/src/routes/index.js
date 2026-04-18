import authRouter from "./auth.routes.js";
import usersRouter from "./user.routes.js";
import doctorsRouter from "./doctor.routes.js";
import appointmentsRouter from "./appointment.routes.js";
import recordsRouter from "./record.routes.js";
import notificationsRouter from "./notification.routes.js";
import profileRouter from "./profile.routes.js";
import emergencyRouter from "./emergency.routes.js";
import triageRouter from "./triage.routes.js";
import healthRouter from "./health.routes.js";

const routes = {
  auth: authRouter,
  users: usersRouter,
  doctors: doctorsRouter,
  appointments: appointmentsRouter,
  records: recordsRouter,
  notifications: notificationsRouter,
  profile: profileRouter,
  emergency: emergencyRouter,
  triage: triageRouter,
  health: healthRouter,
};

export default routes;
