-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('patient', 'doctor', 'ambulance', 'hospital', 'admin');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('appointment', 'records', 'schedule', 'emergency', 'system', 'profile', 'triage');

-- CreateEnum
CREATE TYPE "NotificationRecipient" AS ENUM ('patient', 'doctor', 'ambulance', 'hospital', 'admin', 'all');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('upcoming', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('in_person', 'video');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('pending', 'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EmergencySeverity" AS ENUM ('moderate', 'high', 'critical');

-- CreateEnum
CREATE TYPE "TriageSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "CareSetting" AS ENUM ('self_care', 'primary_care', 'urgent_care', 'emergency');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "userId" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "allergies" TEXT[],
    "diseases" TEXT[],
    "medications" TEXT[],
    "emergencyContact" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "avatar" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL,
    "department" TEXT NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "nextAvailable" TEXT NOT NULL,
    "hospitalId" TEXT,
    "activeEmergencyId" TEXT,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "emergencyReadiness" DOUBLE PRECISION NOT NULL,
    "icuBeds" INTEGER NOT NULL,
    "availableBeds" INTEGER NOT NULL,
    "specialistsOnDuty" TEXT[],

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambulance" (
    "id" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "currentLatitude" DOUBLE PRECISION NOT NULL,
    "currentLongitude" DOUBLE PRECISION NOT NULL,
    "availability" TEXT NOT NULL,
    "baseHospitalId" TEXT NOT NULL,
    "activeEmergencyId" TEXT,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Ambulance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorId" TEXT,
    "doctorName" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "prescriptions" TEXT[],
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientRole" "NotificationRecipient" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyRequest" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "EmergencyStatus" NOT NULL,
    "severity" "EmergencySeverity",
    "requiredSpecialty" TEXT,
    "symptoms" TEXT,
    "location" JSONB NOT NULL,
    "patientLocationMapsUrl" TEXT NOT NULL,
    "nearestHospital" JSONB NOT NULL,
    "ambulanceId" TEXT,
    "assignedAmbulance" JSONB,
    "ambulanceLocation" JSONB,
    "assignedDoctor" JSONB,
    "medicalSnapshot" JSONB,
    "emergencyContact" TEXT,
    "familyContactNotified" BOOLEAN,
    "patientNote" TEXT NOT NULL,
    "handoffMessage" TEXT NOT NULL,
    "dispatchMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyRequest" ADD CONSTRAINT "EmergencyRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRequest" ADD CONSTRAINT "TriageRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
