import {Entity, model, property} from '@loopback/repository';

@model()
export class DepartmentTrainer extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  trainerId?: number;

  @property({
    type: 'number',
  })
  departmentId?: number;

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

  constructor(data?: Partial<DepartmentTrainer>) {
    super(data);
  }
}

export interface DepartmentTrainerRelations {
  // describe navigational properties here
}

export type DepartmentTrainerWithRelations = DepartmentTrainer &
  DepartmentTrainerRelations;
