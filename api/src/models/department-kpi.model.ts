import {Entity, model, property} from '@loopback/repository';

@model()
export class DepartmentKpi extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  departmentId?: number;

  @property({
    type: 'number',
  })
  kpiId?: number;

  @property({
    type: 'date',
  })
  createdAt?: Date;

  @property({
    type: 'date',
  })
  updatedAt?: Date;

  @property({
    type: 'date',
  })
  deletedAt?: Date;

  @property({
    type: 'boolean',
    default: false,
  })
  isDeleted: boolean;

  constructor(data?: Partial<DepartmentKpi>) {
    super(data);
  }
}

export interface DepartmentKpiRelations {
  // describe navigational properties here
}

export type DepartmentKpiWithRelations = DepartmentKpi & DepartmentKpiRelations;
