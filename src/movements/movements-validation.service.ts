import { Injectable } from '@nestjs/common';

import { BalanceDto } from './dto/balance.dto';
import { MovementDto } from './dto/movement.dto';
import { ValidateMovementsDto } from './dto/validate-movements.dto';
import {
  ValidationAcceptedResponseDto,
  ValidationFailedResponseDto,
  ValidationDirection,
  ValidationHintDto,
  ValidationReasonDto,
  ValidationSummaryDto,
} from './dto/validation-response.dto';

type ValidationResult =
  | { isValid: true; response: ValidationAcceptedResponseDto }
  | { isValid: false; response: ValidationFailedResponseDto };

type NormalizedMovement = MovementDto & { timestamp: number };
type NormalizedBalance = BalanceDto & { timestamp: number };

@Injectable()
export class MovementsValidationService {
  validate(payload: ValidateMovementsDto): ValidationResult {
    const movements = this.normalizeMovements(payload.movements);
    const balances = this.normalizeBalances(payload.balances);
    const reasons: ValidationReasonDto[] = [];

    const duplicateBalanceDates = this.findDuplicateBalanceDates(balances);

    if (duplicateBalanceDates.length > 0) {
      const duplicatedDates = [
        ...new Set(duplicateBalanceDates.map((balance) => balance.date)),
      ];

      reasons.push({
        code: 'DUPLICATE_BALANCE_DATE',
        severity: 'error',
        description: `At most one balance is allowed for a given date in this API version. Duplicated date(s): ${duplicatedDates.join(', ')}.`,
      });
    }

    if (balances.length < 2) {
      reasons.push({
        code: 'INSUFFICIENT_CONTROL_POINTS',
        severity: 'error',
        description:
          'At least two balance checkpoints are required to validate a covered period.',
      });
    }

    const intervalReasons = this.validateIntervals(movements, balances);
    
    reasons.push(...intervalReasons);

    const uncontrolledMovementIds = this.findUncontrolledMovementIds(
      movements,
      balances,
    );

    if (uncontrolledMovementIds.length > 0) {
      reasons.push({
        code: 'UNCONTROLLED_MOVEMENTS',
        severity: 'warning',
        description:
          'Some movements are outside the range covered by the provided balance checkpoints.',
        movementIds: uncontrolledMovementIds,
      });
    }

    reasons.push(...this.buildPotentialDuplicateReasons(movements, balances));

    const summary = this.buildSummary(
      balances,
      intervalReasons,
      uncontrolledMovementIds.length,
    );

    const hasBlockingReason = reasons.some(
      (reason) => reason.severity === 'error',
    );

    if (!hasBlockingReason) {
      const warnings = reasons.filter((reason) => reason.severity === 'warning');

      return {
        isValid: true,
        response: {
          message: 'Accepted',
          summary,
          ...(warnings.length > 0 ? { reasons: warnings } : {}),
        },
      };
    }

    return {
      isValid: false,
      response: {
        message: 'Validation failed',
        summary,
        reasons,
      },
    };
  }

  private normalizeMovements(movements: MovementDto[]): NormalizedMovement[] {
    return [...movements]
      .map((movement) => ({
        ...movement,
        timestamp: this.toDayTimestamp(movement.date),
      }))
      .sort(
        (left, right) =>
          left.timestamp - right.timestamp || left.id - right.id,
      );
  }

  private normalizeBalances(balances: BalanceDto[]): NormalizedBalance[] {
    return [...balances]
      .map((balance) => ({
        ...balance,
        timestamp: this.toDayTimestamp(balance.date),
      }))
      .sort((left, right) => left.timestamp - right.timestamp);
  }

  private findDuplicateBalanceDates(
    balances: NormalizedBalance[],
  ): NormalizedBalance[] {
    const seen = new Set<number>();
    const duplicates: NormalizedBalance[] = [];

    for (const balance of balances) {
      if (seen.has(balance.timestamp)) {
        duplicates.push(balance);
      } else {
        seen.add(balance.timestamp);
      }
    }

    return duplicates;
  }

  private validateIntervals(
    movements: NormalizedMovement[],
    balances: NormalizedBalance[],
  ): ValidationReasonDto[] {
    const reasons: ValidationReasonDto[] = [];

    for (let index = 1; index < balances.length; index += 1) {
      const previousBalance = balances[index - 1];
      const currentBalance = balances[index];
      const intervalMovements = movements.filter(
        (movement) =>
          movement.timestamp > previousBalance.timestamp &&
          movement.timestamp <= currentBalance.timestamp,
      );

      const expectedDelta = currentBalance.balance - previousBalance.balance;
      const actualDelta = intervalMovements.reduce(
        (total, movement) => total + movement.amount,
        0,
      );
      const gap = actualDelta - expectedDelta;

      if (gap === 0) {
        continue;
      }

      const duplicateHints = this.findPotentialDuplicateHints(intervalMovements);
      reasons.push({
        code: 'BALANCE_MISMATCH',
        severity: 'error',
        description:
          'The sum of movements does not match the expected balance change for this controlled period.',
        direction: this.toDirection(gap),
        periodStart: previousBalance.date,
        periodEnd: currentBalance.date,
        expectedDelta,
        actualDelta,
        gap,
        movementIds: intervalMovements.map((movement) => movement.id),
        hints: duplicateHints,
      });
    }

    return reasons;
  }

  private findPotentialDuplicateHints(
    movements: NormalizedMovement[],
  ): ValidationHintDto[] {
    const groups = new Map<string, NormalizedMovement[]>();

    for (const movement of movements) {
      const key = `${movement.timestamp}:${movement.amount}:${movement.wording.trim().toLowerCase()}`;
      const existing = groups.get(key);

      if (existing) {
        existing.push(movement);
      } else {
        groups.set(key, [movement]);
      }
    }

    return [...groups.values()]
      .filter((group) => group.length > 1)
      .map((group) => ({
        code: 'POTENTIAL_DUPLICATE_GROUP' as const,
        movementIds: group.map((movement) => movement.id),
        description:
          'Several movements share the same date, amount and wording. They are worth reviewing first.',
      }));
  }

  private buildPotentialDuplicateReasons(
    movements: NormalizedMovement[],
    balances: NormalizedBalance[],
  ): ValidationReasonDto[] {
    const firstBalance = balances[0];
    const lastBalance = balances[balances.length - 1];

    const controlledMovements =
      firstBalance && lastBalance
        ? movements.filter(
            (movement) =>
              movement.timestamp > firstBalance.timestamp &&
              movement.timestamp <= lastBalance.timestamp,
          )
        : movements;

    const hints = this.findPotentialDuplicateHints(controlledMovements);

    return hints.map((hint) => ({
      code: 'POTENTIAL_DUPLICATE_MOVEMENTS',
      severity: 'warning',
      description:
        'A group of very similar movements was detected. This does not prove an error, but it is a strong review candidate.',
      direction: 'balanced',
      movementIds: hint.movementIds,
      hints: [hint],
    }));
  }

  private findUncontrolledMovementIds(
    movements: NormalizedMovement[],
    balances: NormalizedBalance[],
  ): number[] {
    if (balances.length === 0) {
      return movements.map((movement) => movement.id);
    }

    const firstBalance = balances[0];
    const lastBalance = balances[balances.length - 1];

    return movements
      .filter(
        (movement) =>
          movement.timestamp <= firstBalance.timestamp ||
          movement.timestamp > lastBalance.timestamp,
      )
      .map((movement) => movement.id);
  }

  private buildSummary(
    balances: NormalizedBalance[],
    intervalReasons: ValidationReasonDto[],
    uncontrolledMovementCount: number,
  ): ValidationSummaryDto {
    const checkedIntervals = Math.max(balances.length - 1, 0);
    const invalidIntervals = intervalReasons.filter(
      (reason) => reason.code === 'BALANCE_MISMATCH',
    ).length;

    return {
      checkedIntervals,
      validIntervals: Math.max(checkedIntervals - invalidIntervals, 0),
      invalidIntervals,
      uncontrolledMovementCount,
    };
  }

  private toDirection(gap: number): ValidationDirection {
    if (gap > 0) {
      return 'excess';
    }

    if (gap < 0) {
      return 'missing';
    }

    return 'balanced';
  }

  private toDayTimestamp(date: string): number {
    return Date.parse(`${date}T00:00:00.000Z`);
  }
}
