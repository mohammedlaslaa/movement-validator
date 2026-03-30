export type ValidationSeverity = 'error' | 'warning';

export type ValidationReasonCode =
  | 'INSUFFICIENT_CONTROL_POINTS'
  | 'DUPLICATE_BALANCE_DATE'
  | 'BALANCE_MISMATCH'
  | 'UNCONTROLLED_MOVEMENTS'
  | 'POTENTIAL_DUPLICATE_MOVEMENTS';

export type ValidationDirection = 'excess' | 'missing' | 'balanced';

export interface ValidationHintDto {
  code: 'POTENTIAL_DUPLICATE_GROUP';
  movementIds: number[];
  description: string;
}

export interface ValidationReasonDto {
  code: ValidationReasonCode;
  severity: ValidationSeverity;
  description: string;
  direction?: ValidationDirection;
  periodStart?: string;
  periodEnd?: string;
  expectedDelta?: number;
  actualDelta?: number;
  gap?: number;
  movementIds?: number[];
  hints?: ValidationHintDto[];
}

export interface ValidationSummaryDto {
  checkedIntervals: number;
  validIntervals: number;
  invalidIntervals: number;
  uncontrolledMovementCount: number;
}

export interface ValidationAcceptedResponseDto {
  message: 'Accepted';
  summary: ValidationSummaryDto;
  reasons?: ValidationReasonDto[];
}

export interface ValidationFailedResponseDto {
  message: 'Validation failed';
  summary: ValidationSummaryDto;
  reasons: ValidationReasonDto[];
}
