# Dougs Technical Test

API NestJS to validate bank movements against trusted balance checkpoints.

## Main idea

The API does not try to automatically reconstruct the full truth from imperfect bank sync data.
It validates the periods that are effectively covered by two trusted balances and highlights the
periods that need manual review.

## Working assumptions

- A balance at date `D` includes all movements dated `D`.
- `amount` and `balance` are expressed in integer cents.
- Only one balance per date is allowed.
- A period can only be validated if it is framed by two balance checkpoints.
- Movements before the first balance or after the last balance are reported as uncontrolled, not invalid.

## Endpoint

`POST /movements/validation`

- Success status: `200 OK`
- Business validation failure status: `422 Unprocessable Entity`

### Request

```json
{
  "movements": [
    { "id": 1, "date": "2026-01-15", "wording": "Invoice A", "amount": 10000 }
  ],
  "balances": [
    { "date": "2026-01-01", "balance": 100000 },
    { "date": "2026-01-31", "balance": 110000 }
  ]
}
```

### Success response

```json
{
  "message": "Accepted",
  "summary": {
    "checkedIntervals": 1,
    "validIntervals": 1,
    "invalidIntervals": 0,
    "uncontrolledMovementCount": 0
  }
}
```

An accepted response can also include a `reasons` array with non-blocking warnings such as:

- `UNCONTROLLED_MOVEMENTS`
- `POTENTIAL_DUPLICATE_MOVEMENTS`

### Failure response

```json
{
  "message": "Validation failed",
  "summary": {
    "checkedIntervals": 1,
    "validIntervals": 0,
    "invalidIntervals": 1,
    "uncontrolledMovementCount": 0
  },
  "reasons": [
    {
      "code": "BALANCE_MISMATCH",
      "severity": "error",
      "description": "The sum of movements does not match the expected balance change for this controlled period.",
      "periodStart": "2026-01-01",
      "periodEnd": "2026-01-31",
      "expectedDelta": -3000,
      "actualDelta": -6000,
      "gap": -3000,
      "movementIds": [1, 2],
      "hints": [
        {
          "code": "POTENTIAL_DUPLICATE_GROUP",
          "movementIds": [1, 2],
          "description": "Several movements share the same date, amount and wording. They are worth reviewing first."
        }
      ]
    }
  ]
}
```

## Validation flow

1. Sort balances and movements by date.
2. Split the analysis into intervals between two consecutive balances.
3. For each interval, compare:
   - expected delta = `ending balance - starting balance`
   - actual delta = sum of movements in the interval
4. If the values differ, report a `BALANCE_MISMATCH`.
5. Add hints for likely duplicate groups.
6. Report movements outside the covered range as uncontrolled.

## Input validation notes

- The request must include a `balances` array with at least one item.
- At least two balance checkpoints are required for a fully valid business validation result.
- If only one balance is provided, the payload is accepted structurally, but the API returns `422` with `INSUFFICIENT_CONTROL_POINTS`.
- Unknown fields are rejected.

## Run locally

```bash
pnpm install
pnpm start:dev
```

The API starts on `http://localhost:3000`.

## Swagger

Swagger UI is exposed by the running application, so there is no dedicated `pnpm swagger` script.

Start the API:

```bash
pnpm start:dev
```

Then open:

- `http://localhost:3000/docs` for the Swagger UI
- `http://localhost:3000/docs-json` for the raw OpenAPI specification

## Test

```bash
pnpm test
pnpm build
```
