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
import {Department, Kpi} from '../models';
import {DepartmentKpiRepository, DepartmentRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';

export class DepartmentController {
  constructor(
    @repository(DepartmentRepository)
    public departmentRepository: DepartmentRepository,
    @repository(DepartmentKpiRepository)
    public departmentKpiRepository: DepartmentKpiRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [PermissionKeys.SUPER_ADMIN, PermissionKeys.ADMIN],
    },
  })
  @post('/departments')
  @response(200, {
    description: 'Department model instance',
    content: {'application/json': {schema: getModelSchemaRef(Department)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {type: 'string'},
              kpiIds: {
                type: 'array',
                items: {type: 'number'},
              },
            },
          },
        },
      },
    })
    requestBody: {
      name: string;
      kpiIds?: number[];
    },
  ): Promise<Department> {
    const {kpiIds = [], ...departmentData} = requestBody;

    // Create the Department
    const createdDepartment =
      await this.departmentRepository.create(departmentData);

    await Promise.all(
      kpiIds.map(kpiId =>
        this.departmentKpiRepository.create({
          departmentId: createdDepartment.id,
          kpiId: kpiId,
        }),
      ),
    );
    return createdDepartment;
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
  @get('/departments')
  @response(200, {
    description: 'Array of Department model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Department, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Department) filter?: Filter<Department>,
  ): Promise<Department[]> {
    return this.departmentRepository.find({...filter, include: ['kpis']});
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
  @get('/departments/{id}')
  @response(200, {
    description: 'Department model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Department, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Department, {exclude: 'where'})
    filter?: FilterExcludingWhere<Department>,
  ): Promise<Department> {
    return this.departmentRepository.findById(id, {
      ...filter,
      include: ['kpis'],
    });
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @patch('/departments/{id}')
  @response(204, {
    description: 'Department PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {type: 'string'}, // your department fields
              kpiIds: {
                type: 'array',
                items: {type: 'number'},
              },
            },
          },
        },
      },
    })
    requestBody: Partial<Department> & {kpiIds?: number[]},
  ): Promise<void> {
    const {kpiIds, ...departmentData} = requestBody;

    await this.departmentRepository.updateById(id, departmentData);

    if (kpiIds) {
      await this.departmentKpiRepository.deleteAll({departmentId: id});

      await Promise.all(
        kpiIds.map(kpiId => this.departmentRepository.kpis(id).link(kpiId)),
      );
    }
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @del('/departments/{id}')
  @response(204, {
    description: 'Department DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.departmentRepository.deleteById(id);
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
  @get('/departments/{id}/service-kpis')
  @response(200, {
    description: 'Array of active service KPIs for a given department',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            // Adjust this depending on whether you want full model schema or specific fields
            $ref: '#/components/schemas/Kpi',
          },
        },
      },
    },
  })
  async getActiveServiceKpisByDepartmentId(
    @param.path.number('id') id: number,
  ): Promise<Kpi[]> {
    return this.departmentRepository.kpis(id).find({
      where: {
        and: [{isActive: true}, {type: 'service'}],
      },
    });
  }
}
