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
  HttpErrors,
} from '@loopback/rest';
import {Trainer} from '../models';
import {TrainerRepository, UserRepository} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class TrainerController {
  constructor(
    @repository(TrainerRepository)
    public trainerRepository: TrainerRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
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
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.filter(Trainer) filter?: Filter<Trainer>,
  ): Promise<Trainer[]> {
    const user = await this.userRepository.findById(currentUser.id);
    const isSuperOrAdmin =
      user.permissions?.includes(PermissionKeys.SUPER_ADMIN) ||
      user.permissions?.includes(PermissionKeys.ADMIN);
    const isCGM = user.permissions?.includes(PermissionKeys.CGM);
    const isHOD = user.permissions?.includes(PermissionKeys.HOD);
    const updatedFilter: Filter<Trainer> = {
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
    };

    if (isHOD) {
      console.log('here', user.id);
      // HOD should see only trainers where they are the supervisor
      updatedFilter.where = {
        ...updatedFilter.where,
        supervisorId: user.id,
      };
    } else if (isCGM && user.branchId) {
      // CGM should see only trainers in their branch
      updatedFilter.where = {
        ...updatedFilter.where,
        branchId: user.branchId,
      };
    }

    return this.trainerRepository.find(updatedFilter);
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

  @authenticate('jwt')
  @post('/trainers/by-branch-department')
  @response(200, {
    description: 'Trainers filtered by branch and department',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            'x-ts-type': Trainer,
          },
        },
      },
    },
  })
  async getTrainersByBranchAndDepartment(
    @requestBody({
      description: 'Branch and department filter',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['branchId', 'departmentId'],
            properties: {
              branchId: {type: 'number'},
              departmentId: {type: 'number'},
            },
          },
        },
      },
    })
    body: {
      branchId: number;
      departmentId: number;
    },
  ): Promise<Trainer[]> {
    const {branchId, departmentId} = body;

    const trainers = await this.trainerRepository.find({
      where: {
        branchId,
        departmentId,
        isDeleted: false,
        isActive: true,
      },
      include: [
        {
          relation: 'department',
          scope: {
            include: ['kpis'],
          },
        },
      ],
    });

    return trainers;
  }
}
