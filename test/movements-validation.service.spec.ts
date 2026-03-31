import { MovementsValidationService } from '../src/movements/movements-validation.service';

describe('MovementsValidationService', () => {
  let service: MovementsValidationService;

  beforeEach(() => {
    service = new MovementsValidationService();
  });

  it('accepts a fully controlled and consistent interval', () => {
    const result = service.validate({
      movements: [
        {
          id: 1,
          date: '2026-01-15',
          wording: 'Invoice A',
          amount: 10_000,
        },
        {
          id: 2,
          date: '2026-01-20',
          wording: 'Card payment',
          amount: -2_000,
        },
      ],
      balances: [
        { date: '2026-01-01', balance: 100_000 },
        { date: '2026-01-31', balance: 108_000 },
      ],
    });

    expect(result.isValid).toBe(true);

    if (result.isValid) {
      expect(result.response.summary).toEqual({
        checkedIntervals: 1,
        validIntervals: 1,
        invalidIntervals: 0,
        uncontrolledMovementCount: 0,
      });
    }
  });

  it('flags an interval mismatch and suggests duplicate candidates', () => {
    const result = service.validate({
      movements: [
        {
          id: 1,
          date: '2026-01-10',
          wording: 'Subscription',
          amount: -3_000,
        },
        {
          id: 2,
          date: '2026-01-10',
          wording: 'Subscription',
          amount: -3_000,
        },
      ],
      balances: [
        { date: '2026-01-01', balance: 20_000 },
        { date: '2026-01-31', balance: 17_000 },
      ],
    });

    expect(result.isValid).toBe(false);

    if (!result.isValid) {
      expect(result.response.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'BALANCE_MISMATCH',
            gap: -3_000,
            direction: 'missing',
            hints: [
              expect.objectContaining({
                code: 'POTENTIAL_DUPLICATE_GROUP',
                movementIds: [1, 2],
              }),
            ],
          }),
          expect.objectContaining({
            code: 'POTENTIAL_DUPLICATE_MOVEMENTS',
            severity: 'warning',
            movementIds: [1, 2],
          }),
        ]),
      );
    }
  });

  it('marks movements outside the covered range without blocking acceptance', () => {
    const result = service.validate({
      movements: [
        {
          id: 1,
          date: '2026-01-05',
          wording: 'Old movement',
          amount: 500,
        },
        {
          id: 2,
          date: '2026-01-15',
          wording: 'Controlled movement',
          amount: 1_000,
        },
      ],
      balances: [
        { date: '2026-01-10', balance: 10_000 },
        { date: '2026-01-31', balance: 11_000 },
      ],
    });

    expect(result.isValid).toBe(true);

    if (result.isValid) {
      expect(result.response.summary.uncontrolledMovementCount).toBe(1);
    }
  });

  it('does not count movements on the starting balance date in the next interval', () => {
    const result = service.validate({
      movements: [
        {
          id: 1,
          date: '2026-01-01',
          wording: 'Already included in starting balance',
          amount: -200,
        },
        {
          id: 2,
          date: '2026-01-02',
          wording: 'Included in controlled interval',
          amount: 50,
        },
      ],
      balances: [
        { date: '2026-01-01', balance: 1_000 },
        { date: '2026-01-02', balance: 1_050 },
      ],
    });

    expect(result.isValid).toBe(true);

    if (result.isValid) {
      expect(result.response.summary).toEqual({
        checkedIntervals: 1,
        validIntervals: 1,
        invalidIntervals: 0,
        uncontrolledMovementCount: 1,
      });

      expect(result.response.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'UNCONTROLLED_MOVEMENTS',
            movementIds: [1],
          }),
        ]),
      );
    }
  });

  it('fails when there are not enough balance checkpoints', () => {
    const result = service.validate({
      movements: [],
      balances: [{ date: '2026-01-31', balance: 50_000 }],
    });

    expect(result.isValid).toBe(false);

    if (!result.isValid) {
      expect(result.response.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'INSUFFICIENT_CONTROL_POINTS',
          }),
        ]),
      );
    }
  });
});
