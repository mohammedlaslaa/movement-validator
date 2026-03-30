import { Module } from '@nestjs/common';

import { MovementsController } from './movements.controller';
import { MovementsValidationService } from './movements-validation.service';

@Module({
  controllers: [MovementsController],
  providers: [MovementsValidationService],
})
export class MovementsModule {}
