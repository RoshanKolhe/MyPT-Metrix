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
import {Department} from '../models';
import {DepartmentRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';

export class DepartmentController {
  constructor(
    @repository(DepartmentRepository)
    public departmentRepository: DepartmentRepository,
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
            required: ['name'], // add required fields as needed
            properties: {
              name: {type: 'string'}, // adjust for your fields
              kpiIds: {
                type: 'array',
                items: {type: 'number'}, // or string if IDs are string
              },
            },
          },
        },
      },
    })
    requestBody: {name: string; kpiIds?: number[]}, // Adjust shape if needed
  ): Promise<Department> {
    const {kpiIds = [], ...departmentData} = requestBody;

    // Create the Department
    const createdDepartment =
      await this.departmentRepository.create(departmentData);

    // Attach KPIs through the pivot table
    for (const kpiId of kpiIds) {
      await this.departmentRepository.kpis(createdDepartment.id).link(kpiId);
    }

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
      await this.departmentRepository.kpis(id).delete();

      for (const kpiId of kpiIds) {
        await this.departmentRepository.kpis(id).link(kpiId);
      }
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
}
