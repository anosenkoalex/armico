import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!this.schema || metadata.type === 'custom') {
      return value;
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.length ? issue.path.join('.') : '',
        message: issue.message,
      }));

      const message = issues
        .map((issue) =>
          issue.path ? `${issue.path}: ${issue.message}` : issue.message,
        )
        .join('; ');

      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message,
        issues,
      });
    }

    return result.data;
  }
}
