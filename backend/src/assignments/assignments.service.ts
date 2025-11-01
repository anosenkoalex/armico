import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { UpdateAssignmentDto } from './dto/update-assignment.dto.js';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data,
      include: { user: true, workplace: true },
    });
  }

  findAll() {
    return this.prisma.assignment.findMany({
      include: { user: true, workplace: true },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { user: true, workplace: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  async update(id: string, data: UpdateAssignmentDto) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Assignment not found');
    }

    const updated = await this.prisma.assignment.update({
      where: { id },
      data,
      include: { user: true, workplace: true },
    });

    if (
      (data.workplaceId && data.workplaceId !== existing.workplaceId) ||
      (data.status && data.status !== existing.status)
    ) {
      await this.prisma.notification.create({
        data: {
          userId: updated.userId,
          assignmentId: updated.id,
          message: `Назначение обновлено: ${updated.workplace.name} (${updated.status})`,
        },
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notification.deleteMany({ where: { assignmentId: id } });
    return this.prisma.assignment.delete({ where: { id } });
  }

  findCurrentWorkplaceForUser(userId: string) {
    const now = new Date();
    return this.prisma.assignment.findFirst({
      where: {
        userId,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: { workplace: true },
      orderBy: { startsAt: 'asc' },
    });
  }
}
