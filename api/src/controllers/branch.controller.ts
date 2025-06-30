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
import {Branch, Department} from '../models';
import {BranchRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';

export class BranchController {
  constructor(
    @repository(BranchRepository)
    public branchRepository: BranchRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @post('/branches')
  @response(200, {
    description: 'Branch model instance',
    content: {'application/json': {schema: getModelSchemaRef(Branch)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'], // update as per your required fields
            properties: {
              ...getModelSchemaRef(Branch, {
                title: 'NewBranch',
                exclude: ['id'],
              }).definitions?.Branch?.properties,
              departments: {
                type: 'array',
                items: {type: 'object'}, // Accepts materials array
              },
            },
          },
        },
      },
    })
    requestData: {
      name: string;
      // other branch fields...
      departments?: any[];
    },
  ): Promise<Branch> {
    const {departments = [], ...branchData} = requestData;

    // Create the Branch
    const createdBranch = await this.branchRepository.create(branchData);

    for (const dept of departments) {
      await this.branchRepository.departments(createdBranch.id).link(dept.id);
    }

    return createdBranch;
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
  @get('/branches')
  @response(200, {
    description: 'Array of Branch model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Branch, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Branch) filter?: Filter<Branch>): Promise<Branch[]> {
    return this.branchRepository.find({
      ...filter,
      include: [
        {
          relation: 'departments',
          scope: {
            include: ['kpis'],
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
  @get('/branches/{id}')
  @response(200, {
    description: 'Branch model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Branch, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Branch, {exclude: 'where'})
    filter?: FilterExcludingWhere<Branch>,
  ): Promise<Branch> {
    return this.branchRepository.findById(id, {
      ...filter,
      include: ['departments'],
    });
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @patch('/branches/{id}')
  @response(204, {
    description: 'Branch PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Branch, {partial: true}).definitions?.Branch
                ?.properties,
              departments: {
                type: 'array',
                items: {type: 'object'}, // Accepts materials array
              },
            },
          },
        },
      },
    })
    requestData: Partial<Branch> & {departments?: any[]},
  ): Promise<void> {
    const {departments = [], ...branchData} = requestData;

    // Update branch fields
    await this.branchRepository.updateById(id, branchData);

    if (departments && departments.length > 0) {
      // Clear existing department links (junction table)
      await this.branchRepository.departments(id).unlinkAll();
      // Add new department links
      for (const dept of departments) {
        await this.branchRepository.departments(id).link(dept.id);
      }
    }
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @del('/branches/{id}')
  @response(204, {
    description: 'Branch DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.branchRepository.deleteById(id);
  }
}
