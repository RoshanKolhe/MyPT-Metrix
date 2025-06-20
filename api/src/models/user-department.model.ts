import {Entity, model, property} from '@loopback/repository';

@model()
export class UserDepartment extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  userId?: number;

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

  constructor(data?: Partial<UserDepartment>) {
    super(data);
  }
}

export interface UserDepartmentRelations {
  // describe navigational properties here
}

export type UserDepartmentWithRelations = UserDepartment &
  UserDepartmentRelations;
