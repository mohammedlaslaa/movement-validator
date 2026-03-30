import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ValidateMovementsDto } from './dto/validate-movements.dto';
import {
  ValidationAcceptedResponseDto,
} from './dto/validation-response.dto';
import { MovementsValidationService } from './movements-validation.service';

@Controller('movements')
export class MovementsController {
  constructor(
    private readonly movementsValidationService: MovementsValidationService,
  ) {}

  @Post('validation')
  @HttpCode(200)
  validate(
    @Body() payload: ValidateMovementsDto,
  ): ValidationAcceptedResponseDto {
    const result = this.movementsValidationService.validate(payload);

    if (!result.isValid) {
      throw new UnprocessableEntityException(result.response);
    }

    return result.response;
  }
}
