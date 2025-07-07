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
    type: 'array',
    itemType: 'object',
  })
  membershipType: object[];

  @property({
    type: 'string',
    required: true,
  })
  purchaseDate: string;

  @property({
    type: 'number',
    required: true,
  })
  actualPrice: number;

  @property({
    type: 'number',
    required: true,
  })
  discountedPrice: number;

  @property({
    type: 'number',
    required: true,
  })
  validityDays: number;

  @property({
    type: 'number',
    required: false,
    nullable: true,
  })
  freeDays?: number | null;

  @property({
    type: 'number',
    required: false,
    nullable: true,
  })
  freeSessions?: number | null;

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
    nullable: true,
    required: false,
  })
  freezingDays?: number | null;

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
