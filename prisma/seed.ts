
import { PrismaClient, Role } from '@prisma/client';
// import bcrypt from 'bcrypt'; // In a real app, use bcrypt for password hashing

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // const saltRounds = 10; // For bcrypt

  // Create Admin User
  const adminPassword = "adminpassword"; // Store as plain text for this mock-to-DB transition
  // const hashedPasswordAdmin = await bcrypt.hash(adminPassword, saltRounds); // Real app

  await prisma.user.upsert({
    where: { email: 'sistemas@clinicaieq.com' },
    update: {},
    create: {
      name: 'Sistemas ClinicaIEQ',
      email: 'sistemas@clinicaieq.com',
      role: Role.Admin,
      department: 'Sistemas',
      password: adminPassword, // Use hashedPasswordAdmin in real app
      avatarUrl: 'https://placehold.co/100x100.png?text=SC',
    },
  });
  console.log('Admin user systems@clinicaieq.com created/ensured.');

  const presidentePassword = "presidentepassword";
  // const hashedPasswordPresidente = await bcrypt.hash(presidentePassword, saltRounds); // Real app

  await prisma.user.upsert({
    where: { email: 'presidente@clinicaieq.com' },
    update: {},
    create: {
      name: 'Presidente IEQ',
      email: 'presidente@clinicaieq.com',
      role: Role.PresidenteIEQ,
      department: 'Presidente',
      password: presidentePassword, // Use hashedPasswordPresidente in real app
      avatarUrl: 'https://placehold.co/100x100.png?text=PI',
    },
  });
  console.log('User presidente@clinicaieq.com created/ensured.');
  
  // Seed specific approver users
  const approvers = [
    {
      name: "Margarita Malek",
      email: "proveedoresvarios@clinicaieq.com",
      role: Role.User,
      department: "Tesoreria",
      password: "123456789",
      avatarUrl: "https://placehold.co/100x100.png?text=MM",
    },
    {
      name: "Carolina Ramirez",
      email: "gerencia_administracion@clinicaieq.com",
      role: Role.User,
      department: "Gerencia",
      password: "123456789",
      avatarUrl: "https://placehold.co/100x100.png?text=CR",
    },
    {
      name: "Emilia Valderrama",
      email: "electromedicina@clinicaieq.com",
      role: Role.User, // Role can be User, access to modules is also email-based
      department: "Equipos Medicos",
      password: "123456789",
      avatarUrl: "https://placehold.co/100x100.png?text=EV",
    },
    {
      name: "Cesar Gil",
      email: "gerencia_sistemas@clinicaieq.com",
      role: Role.User,
      department: "Gerencia Sistemas",
      password: "123456789",
      avatarUrl: "https://placehold.co/100x100.png?text=CG",
    },
    {
      name: "Pina Aulino",
      email: "suministros@cliniciaeq.com", // Typo in original? clinicaieq.com
      role: Role.User,
      department: "Suministros",
      password: "123456789",
      avatarUrl: "https://placehold.co/100x100.png?text=PA",
    },
  ];

  for (const approver of approvers) {
    // const hashedPassword = await bcrypt.hash(approver.password, saltRounds); // Real app
    await prisma.user.upsert({
      where: { email: approver.email },
      update: {},
      create: {
        name: approver.name,
        email: approver.email,
        role: approver.role,
        department: approver.department,
        password: approver.password, // Use hashedPassword in real app
        avatarUrl: approver.avatarUrl,
      },
    });
    console.log(`Approver user ${approver.email} created/ensured.`);
  }


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
