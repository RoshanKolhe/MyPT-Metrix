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
import {Conduction} from '../models';
import {ConductionRepository} from '../repositories';

export class ConductionController {
  constructor(
    @repository(ConductionRepository)
    public conductionRepository : ConductionRepository,
  ) {}

  @post('/conductions')
  @response(200, {
    description: 'Conduction model instance',
    content: {'application/json': {schema: getModelSchemaRef(Conduction)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Conduction, {
            title: 'NewConduction',
            exclude: ['id'],
          }),
        },
      },
    })
    conduction: Omit<Conduction, 'id'>,
  ): Promise<Conduction> {
    return this.conductionRepository.create(conduction);
  }

  @get('/conductions')
  @response(200, {
    description: 'Array of Conduction model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Conduction, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Conduction) filter?: Filter<Conduction>,
  ): Promise<Conduction[]> {
    return this.conductionRepository.find(filter);
  }

  @get('/conductions/{id}')
  @response(200, {
    description: 'Conduction model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Conduction, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Conduction, {exclude: 'where'}) filter?: FilterExcludingWhere<Conduction>
  ): Promise<Conduction> {
    return this.conductionRepository.findById(id, filter);
  }

  @patch('/conductions/{id}')
  @response(204, {
    description: 'Conduction PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Conduction, {partial: true}),
        },
      },
    })
    conduction: Conduction,
  ): Promise<void> {
    await this.conductionRepository.updateById(id, conduction);
  }

  @del('/conductions/{id}')
  @response(204, {
    description: 'Conduction DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.conductionRepository.deleteById(id);
  }
}
