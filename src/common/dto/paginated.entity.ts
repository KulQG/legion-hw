import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export interface IPaginatedDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function PaginatedEntity<T>(classRef: Type<T>) {
  abstract class PaginatedType implements IPaginatedDto<T> {
    @ApiProperty({ type: [classRef] })
    data!: T[];

    @ApiProperty({ example: 10, description: 'Всего записей в базе данных' })
    total!: number;

    @ApiProperty({ example: 1, description: 'Текущая страница' })
    page!: number;

    @ApiProperty({
      example: 10,
      description: 'Количество элементов на странице',
    })
    limit!: number;

    @ApiProperty({ example: 1, description: 'Всего страниц' })
    totalPages!: number;
  }

  return PaginatedType;
}
