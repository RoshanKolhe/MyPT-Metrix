import {
  Count,
  CountSchema,
  DefaultTransactionalRepository,
  Filter,
  FilterExcludingWhere,
  IsolationLevel,
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
import { Target } from '../models';
import { TargetRepository } from '../repositories';
import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { UserProfile } from '@loopback/security';
import { MyptMetrixDataSource } from '../datasources';

export class TargetController {
  constructor(
    @inject('datasources.myptMetrix')
    public dataSource: MyptMetrixDataSource,
    @repository(TargetRepository)
    public targetRepository: TargetRepository,
  ) { }

  @authenticate('jwt')
  @post('/targets')
  @response(200, {
    description: 'Target assignment response',
    content: { 'application/json': { schema: { type: 'object' } } },
  })
  async assignBranchAndDepartmentTargets(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['branchId', 'targetValue', 'startDate', 'endDate', 'departmentTargets'],
            properties: {
              branchId: { type: 'number' },
              targetValue: { type: 'number' },
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' },
              departmentTargets: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['departmentId', 'targetValue'],
                  properties: {
                    departmentId: { type: 'number' },
                    targetValue: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    })
    input: {
      branchId: number;
      targetValue: number;
      startDate: string;
      endDate: string;
      departmentTargets: { departmentId: number; targetValue: number }[];
    },

    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
  ): Promise<object> {
    const repo = new DefaultTransactionalRepository(Target, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);
    try {
      const { branchId, targetValue, startDate, endDate, departmentTargets } = input;

      if (!currentUser.role.includes('super_admin') || !currentUser.role.includes('admin')) {
        throw new HttpErrors.Forbidden('Only CEO can assign branch targets');
      }
      // 1. Create branch-level target
      await this.targetRepository.create({
        branchId,
        targetValue,
        startDate,
        endDate,
        targetLevel: 'branch',
        assignedByUserId: currentUser.id,
      }, { transaction: tx },);

      // 2. Create department-level targets
      const departmentTargetEntities = departmentTargets.map(dt => ({
        branchId,
        departmentId: dt.departmentId,
        targetValue: dt.targetValue,
        startDate,
        endDate,
        targetLevel: 'department',
        assignedByUserId: currentUser.id,
      }));

      await this.targetRepository.createAll(departmentTargetEntities, { transaction: tx },);

      await tx.commit();
      return {
        message: 'Branch and department targets assigned successfully',
        branchTarget: { branchId, targetValue },
        departmentsAssigned: departmentTargets.length,
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }


  @get('/targets')
  @response(200, {
    description: 'Array of Target model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Target, { includeRelations: true }),
        },
      },
    },
  })
  async find(
    @param.filter(Target) filter?: Filter<Target>,
  ): Promise<Target[]> {
    return this.targetRepository.find(filter);
  }

  @get('/targets/{id}')
  @response(200, {
    description: 'Target model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Target, { includeRelations: true }),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Target, { exclude: 'where' }) filter?: FilterExcludingWhere<Target>
  ): Promise<Target> {
    return this.targetRepository.findById(id, filter);
  }

  @patch('/targets/{id}')
  @response(204, {
    description: 'Target PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Target, { partial: true }),
        },
      },
    })
    target: Target,
  ): Promise<void> {
    await this.targetRepository.updateById(id, target);
  }

  @del('/targets/{id}')
  @response(204, {
    description: 'Target DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.targetRepository.deleteById(id);
  }
}
