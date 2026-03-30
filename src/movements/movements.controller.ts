import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { ValidateMovementsDto } from './dto/validate-movements.dto';
import {
  ValidationAcceptedResponseDto,
  ValidationFailedResponseDto,
} from './dto/validation-response.dto';
import { MovementsValidationService } from './movements-validation.service';

@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(
    @Inject(MovementsValidationService)
    private readonly movementsValidationService: MovementsValidationService,
  ) {}

  @Post('validation')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate movements against balance checkpoints' })
  @ApiBody({ type: ValidateMovementsDto })
  @ApiOkResponse({ type: ValidationAcceptedResponseDto })
  @ApiUnprocessableEntityResponse({ type: ValidationFailedResponseDto })
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
