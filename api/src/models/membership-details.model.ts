import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Sales} from './sales.model';

@model()
export class MembershipDetails extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  purchaseDate: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  validityDays: number;

  @property({
    type: 'number',
    required: true,
  })
  freeDays: number;

  @property({
    type: 'number',
    required: true,
  })
  numberOfSessions: number;

  @property({
    type: 'number',
    required: true,
  })
  freeSessions: number;

  @property({
    type: 'string',
    required: true,
  })
  startDate: string;

  @property({
    type: 'string',
    required: true,
  })
  expiryDate: string;

  @property({
    type: 'number',
    required: true,
  })
  freezingDays: number;

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

  @belongsTo(() => Sales)
  salesId: number;

  constructor(data?: Partial<MembershipDetails>) {
    super(data);
  }
}

export interface MembershipDetailsRelations {
  // describe navigational properties here
}

export type MembershipDetailsWithRelations = MembershipDetails &
  MembershipDetailsRelations;
