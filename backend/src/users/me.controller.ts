import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';
import { AssignmentsService } from '../assignments/assignments.service.js';
import { AssignmentStatus } from '@prisma/client';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Get()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Get('current-workplace')
  async getCurrentWorkplace(@CurrentUser() user: JwtPayload) {
    const [currentAssignment, history] = await Promise.all([
      this.assignmentsService.getCurrentWorkplaceForUser(user.sub),
      this.assignmentsService.getHistoryForUser(user.sub, 10),
    ]);

    const now = new Date();

    const historyItems = history.filter((assignment) => {
      if (currentAssignment && assignment.id === currentAssignment.id) {
        return false;
      }

      if (assignment.status === AssignmentStatus.ARCHIVED) {
        return true;
      }

      return assignment.endsAt ? assignment.endsAt < now : false;
    });

    return {
      workplace: currentAssignment?.workplace ?? null,
      assignment: currentAssignment ?? null,
      history: historyItems,
    };
  }
}
