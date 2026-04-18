import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMERGENCY_HOSPITALS = [
  {
    id: "h-del-101",
    name: "AIIMS Trauma Center",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    phone: "+91 11 2658 8500",
    lat: 28.5672,
    lng: 77.21,
    emergencyReadiness: 0.97,
    icuBeds: 34,
    availableBeds: 42,
    specialistsOnDuty: ["trauma", "cardiology", "neurology", "general"],
  },
  {
    id: "h-del-102",
    name: "Safdarjung Emergency Block",
    address: "Ansari Nagar West, New Delhi",
    phone: "+91 11 2673 0000",
    lat: 28.5675,
    lng: 77.2039,
    emergencyReadiness: 0.92,
    icuBeds: 26,
    availableBeds: 30,
    specialistsOnDuty: ["trauma", "orthopedics", "general", "pulmonology"],
  },
  {
    id: "h-del-103",
    name: "Apollo Emergency Center",
    address: "Sarita Vihar, New Delhi",
    phone: "+91 11 2692 5858",
    lat: 28.5413,
    lng: 77.2831,
    emergencyReadiness: 0.9,
    icuBeds: 22,
    availableBeds: 28,
    specialistsOnDuty: ["cardiology", "neurology", "pulmonology", "general"],
  },
  {
    id: "h-del-104",
    name: "Fortis Emergency Care",
    address: "Shalimar Bagh, New Delhi",
    phone: "+91 11 4530 2222",
    lat: 28.7142,
    lng: 77.1526,
    emergencyReadiness: 0.86,
    icuBeds: 18,
    availableBeds: 24,
    specialistsOnDuty: ["cardiology", "stroke", "general"],
  },
  {
    id: "h-del-105",
    name: "Max Smart Emergency",
    address: "Saket, New Delhi",
    phone: "+91 11 2651 5050",
    lat: 28.5246,
    lng: 77.2066,
    emergencyReadiness: 0.88,
    icuBeds: 16,
    availableBeds: 20,
    specialistsOnDuty: ["neurology", "general", "orthopedics"],
  },
];

const EMERGENCY_AMBULANCES = [
  {
    id: "A-204",
    driverName: "Raj Kumar",
    phone: "+91 98111 22334",
    vehicleNumber: "DL1RX2040",
    currentLatitude: 28.6246,
    currentLongitude: 77.2167,
    availability: "available",
    baseHospitalId: "h-del-101",
  },
  {
    id: "A-178",
    driverName: "Amit Sharma",
    phone: "+91 98111 55670",
    vehicleNumber: "DL1RX1780",
    currentLatitude: 28.556,
    currentLongitude: 77.256,
    availability: "available",
    baseHospitalId: "h-del-103",
  },
  {
    id: "A-112",
    driverName: "Neha Singh",
    phone: "+91 98111 88901",
    vehicleNumber: "DL1RX1120",
    currentLatitude: 28.6455,
    currentLongitude: 77.139,
    availability: "available",
    baseHospitalId: "h-del-104",
  },
  {
    id: "A-089",
    driverName: "Imran Ali",
    phone: "+91 98111 77651",
    vehicleNumber: "DL1RX0890",
    currentLatitude: 28.5342,
    currentLongitude: 77.2178,
    availability: "available",
    baseHospitalId: "h-del-105",
  },
];

const DOCTOR_DIRECTORY = [
  {
    id: "d-em-101",
    name: "Dr. Meera Kapoor",
    specialization: "Emergency Medicine",
    experience: 12,
    rating: 4.9,
    avatar: "",
    available: true,
    department: "Trauma",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-101",
    phone: "+91 98110 77881",
  },
  {
    id: "d-em-102",
    name: "Dr. Arjun Malhotra",
    specialization: "Cardiology",
    experience: 14,
    rating: 4.8,
    avatar: "",
    available: true,
    department: "Cardiac Emergency",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-103",
    phone: "+91 98110 77882",
  },
  {
    id: "d-em-103",
    name: "Dr. Priya Nair",
    specialization: "Neurology",
    experience: 11,
    rating: 4.8,
    avatar: "",
    available: true,
    department: "Stroke Unit",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-104",
    phone: "+91 98110 77883",
  },
  {
    id: "d-em-104",
    name: "Dr. Rohit Verma",
    specialization: "General Medicine",
    experience: 10,
    rating: 4.7,
    avatar: "",
    available: true,
    department: "Emergency Intake",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-102",
    phone: "+91 98110 77884",
  },
  {
    id: "d-em-105",
    name: "Dr. Sana Iqbal",
    specialization: "Pulmonology",
    experience: 9,
    rating: 4.7,
    avatar: "",
    available: true,
    department: "Respiratory Emergency",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-105",
    phone: "+91 98110 77885",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    { name: "Sarah Johnson", email: "patient@careconnect.demo", role: "patient" },
    { name: "Dr. Smith", email: "doctor@careconnect.demo", role: "doctor" },
    { name: "Dispatch Operator", email: "ambulance@careconnect.demo", role: "ambulance" },
    { name: "Hospital Coordinator", email: "hospital@careconnect.demo", role: "hospital" },
    { name: "Admin User", email: "admin@careconnect.demo", role: "admin" },
  ];

  const seededUsers = [];
  for (const user of users) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
      },
    });
    seededUsers.push(upserted);
  }

  for (const user of seededUsers) {
    await prisma.patientProfile.upsert({
      where: { userId: user.id },
      update: {
        bloodGroup: user.role === "patient" ? "O+" : "",
        allergies: user.role === "patient" ? ["Penicillin", "Peanuts"] : [],
        diseases: user.role === "patient" ? ["Mild Hypertension"] : [],
        medications: user.role === "patient" ? ["Amlodipine 5mg"] : [],
        emergencyContact: "+91 98177 66554",
        dateOfBirth: "1992-06-15",
        phone: "+91 98111 22334",
      },
      create: {
        userId: user.id,
        bloodGroup: user.role === "patient" ? "O+" : "",
        allergies: user.role === "patient" ? ["Penicillin", "Peanuts"] : [],
        diseases: user.role === "patient" ? ["Mild Hypertension"] : [],
        medications: user.role === "patient" ? ["Amlodipine 5mg"] : [],
        emergencyContact: "+91 98177 66554",
        dateOfBirth: "1992-06-15",
        phone: "+91 98111 22334",
      },
    });
  }

  for (const hospital of EMERGENCY_HOSPITALS) {
    await prisma.hospital.upsert({
      where: { id: hospital.id },
      update: hospital,
      create: hospital,
    });
  }

  for (const doctor of DOCTOR_DIRECTORY) {
    const { phone, ...rest } = doctor;
    await prisma.doctor.upsert({
      where: { id: doctor.id },
      update: {
        ...rest,
        hospitalId: doctor.hospitalId,
        available: true,
      },
      create: {
        ...rest,
        hospitalId: doctor.hospitalId,
        available: true,
      },
    });
  }

  for (const ambulance of EMERGENCY_AMBULANCES) {
    await prisma.ambulance.upsert({
      where: { id: ambulance.id },
      update: ambulance,
      create: ambulance,
    });
  }

  const patientUser = seededUsers.find((user) => user.role === "patient");
  if (patientUser) {
    const appointmentCount = await prisma.appointment.count({
      where: { userId: patientUser.id },
    });
    if (appointmentCount === 0) {
      await prisma.appointment.createMany({
        data: [
          {
            userId: patientUser.id,
            doctorId: "d-em-102",
            doctorName: "Dr. Arjun Malhotra",
            specialization: "Cardiology",
            date: "2026-04-15",
            time: "3:00 PM",
            status: "upcoming",
            type: "in_person",
          },
          {
            userId: patientUser.id,
            doctorId: "d-em-103",
            doctorName: "Dr. Priya Nair",
            specialization: "Neurology",
            date: "2026-04-18",
            time: "10:00 AM",
            status: "upcoming",
            type: "video",
          },
          {
            userId: patientUser.id,
            doctorId: "d-em-104",
            doctorName: "Dr. Rohit Verma",
            specialization: "General Medicine",
            date: "2026-04-10",
            time: "2:00 PM",
            status: "completed",
            type: "in_person",
          },
        ],
      });
    }

    const recordCount = await prisma.medicalRecord.count({
      where: { userId: patientUser.id },
    });
    if (recordCount === 0) {
      await prisma.medicalRecord.createMany({
        data: [
          {
            userId: patientUser.id,
            date: "2026-04-10",
            diagnosis: "Annual checkup - all clear",
            doctorName: "Dr. Rohit Verma",
            prescriptions: ["Vitamin D 1000IU"],
            notes: "Patient in good health.",
          },
          {
            userId: patientUser.id,
            date: "2026-03-15",
            diagnosis: "Mild hypertension",
            doctorName: "Dr. Arjun Malhotra",
            prescriptions: ["Amlodipine 5mg", "Low-sodium diet"],
            notes: "Follow up in 3 months.",
          },
        ],
      });
    }
  }

  const notificationCount = await prisma.notification.count();
  if (notificationCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          recipientRole: "patient",
          type: "appointment",
          priority: "medium",
          title: "Appointment reminder",
          description: "Dr. Arjun Malhotra is scheduled for today at 3:00 PM.",
          link: "/appointments",
        },
        {
          recipientRole: "patient",
          type: "records",
          priority: "low",
          title: "Lab summary available",
          description: "Your annual checkup summary is ready in records.",
          link: "/records",
        },
        {
          recipientRole: "doctor",
          type: "schedule",
          priority: "medium",
          title: "Clinical standby active",
          description: "Emergency triage coverage is enabled for your shift.",
          link: "/notifications",
        },
        {
          recipientRole: "ambulance",
          type: "emergency",
          priority: "high",
          title: "Dispatch grid online",
          description: "Location matching and auto-assignment are active.",
          link: "/emergency",
        },
        {
          recipientRole: "hospital",
          type: "emergency",
          priority: "high",
          title: "Bed readiness sync",
          description: "Emergency bed status is synced across all hubs.",
          link: "/emergency",
        },
        {
          recipientRole: "admin",
          type: "system",
          priority: "medium",
          title: "Operations summary",
          description: "Emergency response SLA and queue status are healthy.",
          link: "/analytics",
        },
      ],
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
