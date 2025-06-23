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
import {Trainer} from '../models';
import {TrainerRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';

export class TrainerController {
  constructor(
    @repository(TrainerRepository)
    public trainerRepository: TrainerRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
      ],
    },
  })
  @post('/trainers')
  @response(200, {
    description: 'Trainer model instance',
    content: {'application/json': {schema: getModelSchemaRef(Trainer)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Trainer, {
            title: 'NewTrainer',
            exclude: ['id'],
          }),
        },
      },
    })
    trainer: Omit<Trainer, 'id'>,
  ): Promise<Trainer> {
    return this.trainerRepository.create(trainer);
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
      ],
    },
  })
  @get('/trainers')
  @response(200, {
    description: 'Array of Trainer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Trainer, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Trainer) filter?: Filter<Trainer>,
  ): Promise<Trainer[]> {
    return this.trainerRepository.find({
      ...filter,
      include: [
        {relation: 'department'},
        {relation: 'branch'},
        {
          relation: 'supervisor',
          scope: {
            fields: {
              password: false,
              permissions: false,
            },
          },
        },
      ],
    });
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
      ],
    },
  })
  @get('/trainers/{id}')
  @response(200, {
    description: 'Trainer model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Trainer, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Trainer, {exclude: 'where'})
    filter?: FilterExcludingWhere<Trainer>,
  ): Promise<Trainer> {
    return this.trainerRepository.findById(id, {
      ...filter,
      include: [
        {relation: 'department'},
        {relation: 'branch'},
        {
          relation: 'supervisor',
          scope: {
            fields: {
              password: false,
              permissions: false,
            },
          },
        },
      ],
    });
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
      ],
    },
  })
  @patch('/trainers/{id}')
  @response(204, {
    description: 'Trainer PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Trainer, {partial: true}),
        },
      },
    })
    trainer: Trainer,
  ): Promise<void> {
    await this.trainerRepository.updateById(id, trainer);
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
        PermissionKeys.CGM,
      ],
    },
  })
  @del('/trainers/{id}')
  @response(204, {
    description: 'Trainer DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.trainerRepository.deleteById(id);
  }
}
