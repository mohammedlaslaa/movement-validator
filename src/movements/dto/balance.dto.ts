import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt } from 'class-validator';

export class BalanceDto {
  @ApiProperty({ example: '2025-01-31', format: 'date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 325000, description: 'Balance in cents.' })
  @IsInt()
  balance!: number;
}
