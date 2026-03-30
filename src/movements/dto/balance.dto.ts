import { IsDateString, IsInt } from 'class-validator';

export class BalanceDto {
  @IsDateString()
  date!: string;

  @IsInt()
  balance!: number;
}
