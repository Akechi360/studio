import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create Admin User
  await prisma.user.upsert({
    where: { email: 'sistemas@clinicaieq.com' },
    update: {}, // No updates if user exists, just ensures it's there
    create: {
      id: 'auth0|admin-user', // ID de Auth0 para el usuario admin
      name: 'Sistemas ClinicaIEQ',
      email: 'sistemas@clinicaieq.com',
      role: Role.Admin,
      department: 'Sistemas',
      avatarUrl: '/bg-login.jpg',
    },
  });
  console.log('Admin user sistemas@clinicaieq.com created/ensured.');

  // Create Presidente User
  await prisma.user.upsert({
    where: { email: 'presidente@clinicaieq.com' },
    update: {},
    create: {
      id: 'auth0|presidente-user', // ID de Auth0 para el usuario presidente
      name: 'Presidente',
      email: 'presidente@clinicaieq.com',
      role: Role.Presidente,
      department: 'Presidente',
      avatarUrl: '/bg-login.jpg',
    },
  });
  console.log('User presidente@clinicaieq.com created/ensured.');

  // Create Electromedicina User
  await prisma.user.upsert({
    where: { email: 'electromedicina@clinicaieq.com' },
    update: {},
    create: {
      id: 'auth0|electromedicina-user', // ID de Auth0 para el usuario de electromedicina
      name: 'Electromedicina',
      email: 'electromedicina@clinicaieq.com',
      role: Role.Electromedicina,
      department: 'Electromedicina',
      avatarUrl: '/bg-login.jpg',
    },
  });
  console.log('User electromedicina@clinicaieq.com created/ensured.');

  // Seed specific approver users
  const approvers = [
    {
      id: 'auth0|approver-1',
      name: "Margarita Malek",
      email: "proveedoresvarios@clinicaieq.com",
      role: Role.User,
      department: "Tesoreria",
      avatarUrl: "https://placehold.co/100x100.png?text=MM",
    },
    {
      id: 'auth0|approver-2',
      name: "Carolina Ramirez",
      email: "gerencia_administracion@clinicaieq.com",
      role: Role.User,
      department: "Gerencia",
      avatarUrl: "https://placehold.co/100x100.png?text=CR",
    },
    {
      id: 'auth0|approver-3',
      name: "Emilia Valderrama",
      email: "electromedicina@clinicaieq.com",
      role: Role.User, 
      department: "Equipos Medicos",
      avatarUrl: "https://placehold.co/100x100.png?text=EV",
    },
    {
      id: 'auth0|approver-4',
      name: "Cesar Gil",
      email: "gerencia_sistemas@clinicaieq.com",
      role: Role.User,
      department: "Gerencia Sistemas",
      avatarUrl: "https://placehold.co/100x100.png?text=CG",
    },
    {
      id: 'auth0|approver-5',
      name: "Pina Aulino",
      email: "suministros@clinicaieq.com",
      role: Role.User,
      department: "Suministros",
      avatarUrl: "https://placehold.co/100x100.png?text=PA",
    },
  ];

  for (const approver of approvers) {
    await prisma.user.upsert({
      where: { email: approver.email },
      update: {},
      create: {
        id: approver.id,
        name: approver.name,
        email: approver.email,
        role: approver.role,
        department: approver.department,
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
