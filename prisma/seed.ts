
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const saltRounds = 10;

  // Create Admin User
  const adminPassword = "adminpassword"; // Default admin password
  const hashedPasswordAdmin = await bcrypt.hash(adminPassword, saltRounds);

  await prisma.user.upsert({
    where: { email: 'sistemas@clinicaieq.com' },
    update: {}, // No updates if user exists, just ensures it's there
    create: {
      name: 'Sistemas ClinicaIEQ',
      email: 'sistemas@clinicaieq.com',
      role: Role.Admin,
      department: 'Sistemas',
      password: hashedPasswordAdmin,
      avatarUrl: 'https://placehold.co/100x100.png?text=SC',
    },
  });
  console.log('Admin user sistemas@clinicaieq.com created/ensured.');

  // Create Presidente User
  const presidentePassword = "presidentepassword"; // Default presidente password
  const hashedPasswordPresidente = await bcrypt.hash(presidentePassword, saltRounds);

  await prisma.user.upsert({
    where: { email: 'presidente@clinicaieq.com' },
    update: {},
    create: {
      name: 'Presidente IEQ',
      email: 'presidente@clinicaieq.com',
      role: Role.PresidenteIEQ,
      department: 'Presidente',
      password: hashedPasswordPresidente,
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
      role: Role.User, 
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
      email: "suministros@clinicaieq.com", // Corrected email from cliniciaeq.com to clinicaieq.com
      role: Role.User,
      department: "Suministros",
      password: "123456789",
      avatarUrl: "https://placehold.co/100x100.png?text=PA",
    },
  ];

  for (const approver of approvers) {
    const hashedPassword = await bcrypt.hash(approver.password, saltRounds);
    await prisma.user.upsert({
      where: { email: approver.email },
      update: {},
      create: {
        name: approver.name,
        email: approver.email,
        role: approver.role,
        department: approver.department,
        password: hashedPassword,
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
