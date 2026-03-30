import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { BalanceDto } from './balance.dto';
import { MovementDto } from './movement.dto';

export class ValidateMovementsDto {
  @ApiProperty({ type: () => [MovementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  movements!: MovementDto[];

  @ApiProperty({ type: () => [BalanceDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  balances!: BalanceDto[];
}
