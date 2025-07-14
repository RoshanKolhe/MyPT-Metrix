import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Kpi} from '../models';
import {KpiRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';

export class KpiController {
  constructor(
    @repository(KpiRepository)
    public kpiRepository: KpiRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @post('/kpis')
  @response(200, {
    description: 'Kpi model instance',
    content: {'application/json': {schema: getModelSchemaRef(Kpi)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Kpi, {
            title: 'NewKpi',
            exclude: ['id'],
          }),
        },
      },
    })
    kpi: Omit<Kpi, 'id'>,
  ): Promise<Kpi> {
    return this.kpiRepository.create(kpi);
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/kpis')
  @response(200, {
    description: 'Array of Kpi model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Kpi, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Kpi) filter?: Filter<Kpi>): Promise<Kpi[]> {
    return this.kpiRepository.find(filter);
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
      ],
    },
  })
  @get('/kpis/{id}')
  @response(200, {
    description: 'Kpi model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Kpi, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Kpi, {exclude: 'where'}) filter?: FilterExcludingWhere<Kpi>,
  ): Promise<Kpi> {
    return this.kpiRepository.findById(id, filter);
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @patch('/kpis/{id}')
  @response(204, {
    description: 'Kpi PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Kpi, {partial: true}),
        },
      },
    })
    kpi: Kpi,
  ): Promise<void> {
    await this.kpiRepository.updateById(id, kpi);
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @del('/kpis/{id}')
  @response(204, {
    description: 'Kpi DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.kpiRepository.deleteById(id);
  }
}
