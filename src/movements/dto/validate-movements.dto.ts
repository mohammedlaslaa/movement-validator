import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { BalanceDto } from './balance.dto';
import { MovementDto } from './movement.dto';

export class ValidateMovementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  movements!: MovementDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  balances!: BalanceDto[];
}
