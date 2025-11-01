import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';
import { AssignmentStatus, UserRole } from '@prisma/client';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const orgName = 'Armico';
    let org = await this.prisma.org.findFirst({ where: { name: orgName } });

    if (!org) {
      org = await this.prisma.org.create({
        data: {
          name: orgName,
          timezone: 'UTC',
        },
      });
    }

    const adminEmail = 'admin@armico.local';
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: passwordHash,
          role: UserRole.SUPER_ADMIN,
          orgId: org.id,
          fullName: 'System Administrator',
          position: 'Administrator',
        },
      });
    }
  }

  async create(data: CreateUserDto) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password: passwordHash },
      select: {
        id: true,
        email: true,
        fullName: true,
        position: true,
        role: true,
        orgId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        position: true,
        role: true,
        orgId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        position: true,
        role: true,
        orgId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id);
    const payload = { ...data } as UpdateUserDto & { password?: string };

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        email: true,
        fullName: true,
        position: true,
        role: true,
        orgId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notification.deleteMany({ where: { userId: id } });
    await this.prisma.assignment.deleteMany({ where: { userId: id } });
    return this.prisma.user.delete({ where: { id } });
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        org: true,
        assignments: {
          include: { workplace: true },
          orderBy: { startsAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();

    const assignments = user.assignments.map((assignment) => {
      let derivedStatus = assignment.status;

      if (now < assignment.startsAt) {
        derivedStatus = AssignmentStatus.PLANNED;
      } else if (now > assignment.endsAt) {
        derivedStatus = AssignmentStatus.COMPLETED;
      } else {
        derivedStatus = AssignmentStatus.ACTIVE;
      }

      return {
        ...assignment,
        status: derivedStatus,
      };
    });

    const currentAssignment = assignments.find(
      (assignment) => assignment.status === AssignmentStatus.ACTIVE,
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      position: user.position,
      role: user.role,
      org: {
        id: user.org.id,
        name: user.org.name,
      },
      currentAssignment: currentAssignment ?? null,
      assignments,
    };
  }
}
