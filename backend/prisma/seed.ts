import {
  AssignmentStatus,
  NotificationType,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.workplace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();

  const org = await prisma.org.create({
    data: {
      name: 'Armico',
      slug: 'armico',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@armico.local',
      password: await bcrypt.hash('admin123', 10),
      role: UserRole.SUPER_ADMIN,
      fullName: 'System Administrator',
      position: 'Administrator',
      orgId: org.id,
    },
  });

  const [olga, dmitry] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'olga@armico.local',
        password: await bcrypt.hash('password123', 10),
        role: UserRole.USER,
        fullName: 'Ольга Смирнова',
        position: 'HR specialist',
        orgId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'dmitry@armico.local',
        password: await bcrypt.hash('password123', 10),
        role: UserRole.USER,
        fullName: 'Дмитрий Иванов',
        position: 'Support engineer',
        orgId: org.id,
      },
    }),
  ]);

  const [hq, support] = await Promise.all([
    prisma.workplace.create({
      data: {
        orgId: org.id,
        code: 'HQ-001',
        name: 'Headquarters',
        location: 'Москва, ул. Арбат, 15',
        isActive: true,
      },
    }),
    prisma.workplace.create({
      data: {
        orgId: org.id,
        code: 'SUP-001',
        name: 'Support Center',
        location: 'Екатеринбург, ул. Ленина, 22',
        isActive: true,
      },
    }),
  ]);

  const assignment = await prisma.assignment.create({
    data: {
      userId: olga.id,
      workplaceId: hq.id,
      startsAt: new Date(),
      endsAt: null,
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: dmitry.id,
      workplaceId: support.id,
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endsAt: null,
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: NotificationType.ASSIGNMENT_CREATED,
        payload: {
          assignmentId: assignment.id,
          workplaceCode: hq.code,
          workplaceName: hq.name,
          startsAt: assignment.startsAt,
          endsAt: assignment.endsAt,
          status: assignment.status,
        },
      },
      {
        userId: olga.id,
        type: NotificationType.ASSIGNMENT_CREATED,
        payload: {
          assignmentId: assignment.id,
          workplaceCode: hq.code,
          workplaceName: hq.name,
          startsAt: assignment.startsAt,
          endsAt: assignment.endsAt,
          status: assignment.status,
        },
      },
    ],
  });

  console.log('Database has been seeded');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
