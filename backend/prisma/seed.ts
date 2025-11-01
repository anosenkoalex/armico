import { PrismaClient, AssignmentStatus, UserRole } from '@prisma/client';
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
      timezone: 'UTC',
    },
  });

  const users = await Promise.all(
    [
      {
        email: 'admin@armico.local',
        password: 'admin123',
        role: UserRole.SUPER_ADMIN,
        fullName: 'Мария Смирнова',
        position: 'Руководитель IT',
      },
      {
        email: 'manager@armico.local',
        password: 'manager123',
        role: UserRole.ORG_ADMIN,
        fullName: 'Иван Петров',
        position: 'Операционный директор',
      },
      {
        email: 'worker1@armico.local',
        password: 'worker123',
        role: UserRole.WORKER,
        fullName: 'Светлана Кузнецова',
        position: 'HR-специалист',
      },
      {
        email: 'worker2@armico.local',
        password: 'worker123',
        role: UserRole.WORKER,
        fullName: 'Дмитрий Волков',
        position: 'Разработчик',
      },
      {
        email: 'worker3@armico.local',
        password: 'worker123',
        role: UserRole.WORKER,
        fullName: 'Анна Орлова',
        position: 'Менеджер по продажам',
      },
    ].map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    })),
  );

  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.create({
        data: {
          orgId: org.id,
          email: user.email,
          password: user.password,
          role: user.role,
          fullName: user.fullName,
          position: user.position,
        },
      }),
    ),
  );

  const [hq, remote, support] = await Promise.all([
    prisma.workplace.create({
      data: {
        orgId: org.id,
        name: 'Головной офис',
        address: 'Москва, ул. Арбат, 15',
        capacity: 50,
      },
    }),
    prisma.workplace.create({
      data: {
        orgId: org.id,
        name: 'Удалённый кластер',
        address: 'Санкт-Петербург, Невский проспект, 45',
        capacity: 30,
      },
    }),
    prisma.workplace.create({
      data: {
        orgId: org.id,
        name: 'Центр поддержки',
        address: 'Екатеринбург, ул. Ленина, 22',
        capacity: 20,
      },
    }),
  ]);

  const [admin, manager, worker1, worker2, worker3] = createdUsers;

  const now = new Date();
  const day = 1000 * 60 * 60 * 24;

  await prisma.assignment.createMany({
    data: [
      {
        orgId: org.id,
        userId: manager.id,
        workplaceId: hq.id,
        startsAt: new Date(now.getTime() - day * 30),
        endsAt: new Date(now.getTime() + day * 180),
        status: AssignmentStatus.ACTIVE,
      },
      {
        orgId: org.id,
        userId: worker1.id,
        workplaceId: support.id,
        startsAt: new Date(now.getTime() - day * 15),
        endsAt: new Date(now.getTime() + day * 15),
        status: AssignmentStatus.ACTIVE,
      },
      {
        orgId: org.id,
        userId: worker2.id,
        workplaceId: remote.id,
        startsAt: new Date(now.getTime() + day * 7),
        endsAt: new Date(now.getTime() + day * 90),
        status: AssignmentStatus.PLANNED,
      },
      {
        orgId: org.id,
        userId: worker3.id,
        workplaceId: support.id,
        startsAt: new Date(now.getTime() - day * 120),
        endsAt: new Date(now.getTime() - day * 10),
        status: AssignmentStatus.COMPLETED,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: worker1.id,
        message: 'Вы закреплены за центром поддержки',
      },
      {
        userId: worker2.id,
        message: 'Подготовьтесь к старту работы в удалённом кластере',
      },
    ],
  });

  console.log('Database has been seeded');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
