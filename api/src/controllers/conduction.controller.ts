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
  getFilterSchemaFor,
} from '@loopback/rest';
import {Conduction} from '../models';
import {ConductionRepository, UserRepository} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class ConductionController {
  constructor(
    @repository(ConductionRepository)
    public conductionRepository: ConductionRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
      ],
    },
  })
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

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
      ],
    },
  })
  @get('/conductions')
  @response(200, {
    description: 'Array of Conduction model instances with pagination',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(Conduction, {includeRelations: true}),
            },
            total: {type: 'number'},
          },
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.query.object('filter', getFilterSchemaFor(Conduction))
    filter?: Filter<Conduction>,
  ): Promise<{data: Conduction[]; total: number}> {
    const user = await this.userRepository.findById(currentUser.id);

    const isCGM = user.permissions?.includes(PermissionKeys.CGM);
    const isHOD = user.permissions?.includes(PermissionKeys.HOD);
    const isSubHOD = user.permissions?.includes(PermissionKeys.SUB_HOD);

    filter = filter ?? {};

    const updatedFilter: Filter<Conduction> = {
      ...filter,
      where: {
        ...(filter.where ?? {}),
        isDeleted: false,
      },
      include: [
        {relation: 'trainer',
          scope:{
            where:{
              trainer:{
                firstName:''
              }
            }
          }
        },
        {relation: 'kpi'},
        {relation: 'branch'},
        {relation: 'department'},
      ],
    };

    if ((isCGM || isHOD || isSubHOD) && user.branchId) {
      updatedFilter.where = {
        ...updatedFilter.where,
        branchId: user.branchId,
      };
    }

    const data = await this.conductionRepository.find(updatedFilter);
    const total = await this.conductionRepository.count(updatedFilter.where);

    return {data, total: total.count};
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
      ],
    },
  })
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
    @param.filter(Conduction, {exclude: 'where'})
    filter?: FilterExcludingWhere<Conduction>,
  ): Promise<Conduction> {
    return this.conductionRepository.findById(id, {
      ...filter,
      include: ['trainer', 'kpi', 'branch', 'department'],
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
        PermissionKeys.SUB_HOD,
      ],
    },
  })
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

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
        PermissionKeys.SUB_HOD,
      ],
    },
  })
  @del('/conductions/{id}')
  @response(204, {
    description: 'Conduction DELETE success',
  })
  async deleteById(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const conduction = await this.conductionRepository.findById(id);
    console.log('conduction', conduction);
    if (!conduction) {
      throw new HttpErrors.BadRequest('Conduction Not Found');
    }

    await this.conductionRepository.updateById(id, {
      isDeleted: true,
      deletedBy: currentUser.id,
      deletedAt: new Date(),
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
        PermissionKeys.SUB_HOD,
      ],
    },
  })
  @post('/conductions/bulk')
  @response(200, {
    description: 'Create multiple conduction entries',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Conduction),
        },
      },
    },
  })
  async createBulk(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Conduction, {
              title: 'NewConduction',
              exclude: ['id'],
            }),
          },
        },
      },
    })
    conductions: Omit<Conduction, 'id'>[],
  ): Promise<Conduction[]> {
    return this.conductionRepository.createAll(conductions);
  }
}
