import { Entity, model, property, belongsTo} from '@loopback/repository';
import {Branch} from './branch.model';
import {Department} from './department.model';
import {Trainer} from './trainer.model';
import {User} from './user.model';

@model()
export class Target extends Entity {
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
    required: true,
  })
  startDate: string;

  @property({
    type: 'date',
    required: true,
  })
  endDate: string;

  @property({
    type: 'string',
    required: true,
  })
  targetLevel: string;

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

  @belongsTo(() => Branch)
  branchId: number;

  @belongsTo(() => Department)
  departmentId: number;

  @belongsTo(() => Trainer)
  trainerId: number;

  @belongsTo(() => User)
  assignedByUserId: number;

  constructor(data?: Partial<Target>) {
    super(data);
  }
}

export interface TargetRelations {
  // describe navigational properties here
}

export type TargetWithRelations = Target & TargetRelations;
