import {Entity, model, property} from '@loopback/repository';

@model()
export class BranchDepartment extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  branchId?: number;

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

  constructor(data?: Partial<BranchDepartment>) {
    super(data);
  }
}

export interface BranchDepartmentRelations {
  // describe navigational properties here
}

export type BranchDepartmentWithRelations = BranchDepartment &
  BranchDepartmentRelations;
