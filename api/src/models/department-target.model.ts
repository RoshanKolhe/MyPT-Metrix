import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {Department} from './department.model';
import {Target} from './target.model';
import {TrainerTarget} from './trainer-target.model';

@model()
export class DepartmentTarget extends Entity {
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

  @belongsTo(() => Department)
  departmentId: number;

  @belongsTo(() => Target)
  targetId: number;

  @hasMany(() => TrainerTarget)
  trainerTargets: TrainerTarget[];

  constructor(data?: Partial<DepartmentTarget>) {
    super(data);
  }
}

export interface DepartmentTargetRelations {
  // describe navigational properties here
}

export type DepartmentTargetWithRelations = DepartmentTarget &
  DepartmentTargetRelations;
