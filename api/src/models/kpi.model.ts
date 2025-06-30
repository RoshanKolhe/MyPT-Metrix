import {Entity, model, property} from '@loopback/repository';

@model()
export class Kpi extends Entity {
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
  name: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: ['sales', 'service'],
    },
  })
  type: 'sales' | 'service';

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
    type: 'boolean',
    required: true,
  })
  isActive: boolean;

  constructor(data?: Partial<Kpi>) {
    super(data);
  }
}

export interface KpiRelations {
  // describe navigational properties here
}

export type KpiWithRelations = Kpi & KpiRelations;
