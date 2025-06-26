import {Entity, model, property, belongsTo} from '@loopback/repository';
import {DepartmentTarget} from './department-target.model';
import {Trainer} from './trainer.model';

@model()
export class TrainerTarget extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  targetValue: number;

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

  @belongsTo(() => DepartmentTarget)
  departmentTargetId: number;

  @belongsTo(() => Trainer)
  trainerId: number;

  constructor(data?: Partial<TrainerTarget>) {
    super(data);
  }
}

export interface TrainerTargetRelations {
  // describe navigational properties here
}

export type TrainerTargetWithRelations = TrainerTarget & TrainerTargetRelations;
