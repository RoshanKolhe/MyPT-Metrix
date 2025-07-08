import {Entity, model, property, hasOne, belongsTo} from '@loopback/repository';
import {MembershipDetails} from './membership-details.model';
import {Trainer} from './trainer.model';
import {Branch} from './branch.model';
import {Department} from './department.model';

@model()
export class Sales extends Entity {
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
  memberName: string;

  @property({
    type: 'string',
    required: true,
  })
  gender: string;

  @property({
    type: 'string',
    required: true,
  })
  trainingAt: string;

  @property({
    type: 'string',
  })
  memberType?: string;

  @property({
    type: 'string',
  })
  sourceOfLead?: string;

  @property({
    type: 'string',
  })
  email: string;

  @property({
    type: 'string',
  })
  contactNumber?: string;

  @property({
    type: 'string',
  })
  paymentMode?: string;

  @property({
    type: 'string',
  })
  paymentReceiptNumber?: string;

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

  @hasOne(() => MembershipDetails)
  membershipDetails: MembershipDetails;

  @belongsTo(() => Trainer)
  trainerId: number;

  @belongsTo(() => Trainer)
  salesTrainerId: number;

  @belongsTo(() => Branch)
  branchId: number;

  @belongsTo(() => Department)
  departmentId: number;

  constructor(data?: Partial<Sales>) {
    super(data);
  }
}

export interface SalesRelations {
  // describe navigational properties here
}

export type SalesWithRelations = Sales & SalesRelations;
