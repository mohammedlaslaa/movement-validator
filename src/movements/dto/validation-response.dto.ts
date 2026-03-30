import { ApiProperty } from '@nestjs/swagger';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationReasonCode =
  | 'INSUFFICIENT_CONTROL_POINTS'
  | 'DUPLICATE_BALANCE_DATE'
  | 'BALANCE_MISMATCH'
  | 'UNCONTROLLED_MOVEMENTS'
  | 'POTENTIAL_DUPLICATE_MOVEMENTS';

export type ValidationDirection = 'excess' | 'missing' | 'balanced';

export class ValidationHintDto {
  @ApiProperty({ example: 'POTENTIAL_DUPLICATE_GROUP' })
  code!: 'POTENTIAL_DUPLICATE_GROUP';

  @ApiProperty({ example: [12, 18] })
  movementIds!: number[];

  @ApiProperty({
    example:
      'Several movements share the same date, amount and wording. They are worth reviewing first.',
  })
  description!: string;
}

export class ValidationReasonDto {
  @ApiProperty({
    enum: [
      'INSUFFICIENT_CONTROL_POINTS',
      'DUPLICATE_BALANCE_DATE',
      'BALANCE_MISMATCH',
      'UNCONTROLLED_MOVEMENTS',
      'POTENTIAL_DUPLICATE_MOVEMENTS',
    ],
  })
  code!: ValidationReasonCode;

  @ApiProperty({ enum: ['error', 'warning'] })
  severity!: ValidationSeverity;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: ['excess', 'missing', 'balanced'], required: false })
  direction?: ValidationDirection;

  @ApiProperty({ example: '2025-01-01', format: 'date', required: false })
  periodStart?: string;

  @ApiProperty({ example: '2025-01-31', format: 'date', required: false })
  periodEnd?: string;

  @ApiProperty({ example: 50000, required: false })
  expectedDelta?: number;

  @ApiProperty({ example: 45000, required: false })
  actualDelta?: number;

  @ApiProperty({ example: -5000, required: false })
  gap?: number;

  @ApiProperty({ example: [1, 2, 3], required: false })
  movementIds?: number[];

  @ApiProperty({ type: () => [ValidationHintDto], required: false })
  hints?: ValidationHintDto[];
}

export class ValidationSummaryDto {
  @ApiProperty({ example: 3 })
  checkedIntervals!: number;

  @ApiProperty({ example: 2 })
  validIntervals!: number;

  @ApiProperty({ example: 1 })
  invalidIntervals!: number;

  @ApiProperty({ example: 4 })
  uncontrolledMovementCount!: number;
}

export class ValidationAcceptedResponseDto {
  @ApiProperty({ example: 'Accepted' })
  message!: 'Accepted';

  @ApiProperty({ type: () => ValidationSummaryDto })
  summary!: ValidationSummaryDto;

  @ApiProperty({ type: () => [ValidationReasonDto], required: false })
  reasons?: ValidationReasonDto[];
}

export class ValidationFailedResponseDto {
  @ApiProperty({ example: 'Validation failed' })
  message!: 'Validation failed';

  @ApiProperty({ type: () => ValidationSummaryDto })
  summary!: ValidationSummaryDto;

  @ApiProperty({ type: () => [ValidationReasonDto] })
  reasons!: ValidationReasonDto[];
}
