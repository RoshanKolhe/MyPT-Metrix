import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';
import {Branch} from './branch.model';
import {Department} from './department.model';

@model()
export class Trainer extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  firstName: string;

  @property({
    type: 'string',
  })
  lastName: string;

  @property({
    type: 'string',
  })
  dob: string;

  @property({
    type: 'string',
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  phoneNumber: string;

  @property({
    type: 'object',
  })
  avatar?: object;

  @property({
    type: 'boolean',
    required: true,
  })
  isActive: boolean;

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

  @belongsTo(() => User)
  supervisorId: number;

  @belongsTo(() => Branch)
  branchId: number;

  @belongsTo(() => Department)
  departmentId: number;

  constructor(data?: Partial<Trainer>) {
    super(data);
  }
}

export interface TrainerRelations {
  // describe navigational properties here
}

export type TrainerWithRelations = Trainer & TrainerRelations;
