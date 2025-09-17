import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Trainer} from './trainer.model';
import {Kpi} from './kpi.model';
import {Branch} from './branch.model';
import {Department} from './department.model';
import {User} from './user.model';

@model()
export class Conduction extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    default: 0.0,
    dataType: 'decimal',
    precision: 30,
    scale: 2,
    required: true,
  })
  conductions: number;

  @property({
    type: 'date',
  })
  conductionDate?: Date;

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

  @belongsTo(() => Trainer)
  trainerId: number;

  @belongsTo(() => Kpi)
  kpiId: number;

  @belongsTo(() => Branch)
  branchId: number;

  @belongsTo(() => Department)
  departmentId: number;

  @belongsTo(() => User, {name: 'deletedByUser'})
  deletedBy: number;

  constructor(data?: Partial<Conduction>) {
    super(data);
  }
}

export interface ConductionRelations {
   trainer?: Trainer;
  kpi?: Kpi;
  branch?: Branch;
  department?: Department;
  deletedByUser?: User;
}

export type ConductionWithRelations = Conduction & ConductionRelations;
