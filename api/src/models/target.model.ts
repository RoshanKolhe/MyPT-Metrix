import {
  Entity,
  model,
  property,
  belongsTo,
  hasMany,
} from '@loopback/repository';
import {Branch} from './branch.model';
import {Department} from './department.model';
import {User} from './user.model';
import {Trainer} from './trainer.model';
import {DepartmentTarget} from './department-target.model';

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
    type: 'string',
    required: true,
  })
  startDate: string;

  @property({
    type: 'string',
    required: true,
  })
  endDate: string;

  @property({
    type: 'string',
  })
  requestChangeReason?: string;

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

  @property({
    type: 'number',
    default: 0,
  })
  status?: number; // 0: pending for approval, 1:approved , 2:rejected

  @belongsTo(() => Branch)
  branchId: number;

  @belongsTo(() => User)
  assignedByUserId: number;

  @belongsTo(() => User)
  cgmApproverUserId: number;

  @hasMany(() => DepartmentTarget)
  departmentTargets: DepartmentTarget[];

  constructor(data?: Partial<Target>) {
    super(data);
  }
}

export interface TargetRelations {
  // describe navigational properties here
}

export type TargetWithRelations = Target & TargetRelations;
