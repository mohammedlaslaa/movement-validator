import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class MovementDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty({ example: '2025-01-15', format: 'date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'Virement salaire' })
  @IsString()
  wording!: string;

  @ApiProperty({ example: 250000, description: 'Amount in cents.' })
  @IsInt()
  amount!: number;
}
