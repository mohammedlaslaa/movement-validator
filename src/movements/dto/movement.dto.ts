import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class MovementDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsDateString()
  date!: string;

  @IsString()
  wording!: string;

  @IsInt()
  amount!: number;
}
