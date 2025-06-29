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
import {DepartmentTarget, Target} from '../models';
import {
  DepartmentTargetRepository,
  TargetRepository,
  TrainerTargetRepository,
} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';
import {MyptMetrixDataSource} from '../datasources';

export class TargetController {
  constructor(
    @inject('datasources.myptMetrix')
    public dataSource: MyptMetrixDataSource,
    @repository(TargetRepository)
    public targetRepository: TargetRepository,
    @repository(DepartmentTargetRepository)
    public departmentTargetRepository: DepartmentTargetRepository,
    @repository(TrainerTargetRepository)
    public trainerTargetRepository: TrainerTargetRepository,
  ) {}

  @authenticate('jwt')
  @post('/targets')
  @response(200, {
    description: 'Target assignment response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'},
            branchTarget: {type: 'object'},
            departmentsAssigned: {type: 'number'},
          },
        },
      },
    },
  })
  async assignBranchAndDepartmentTargets(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: [
              'branchId',
              'targetValue',
              'startDate',
              'endDate',
              'departmentTargets',
            ],
            properties: {
              branchId: {type: 'number'},
              cgmApproverUserId: {type: 'number'},
              targetValue: {type: 'number'},
              startDate: {type: 'string'},
              endDate: {type: 'string'},
              departmentTargets: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['departmentId', 'targetValue'],
                  properties: {
                    departmentId: {type: 'number'},
                    targetValue: {type: 'number'},
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
      cgmApproverUserId: number;
      targetValue: number;
      startDate: string;
      endDate: string;
      departmentTargets: {departmentId: number; targetValue: number}[];
    },

    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<object> {
    const repo = new DefaultTransactionalRepository(Target, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const {
        branchId,
        cgmApproverUserId,
        targetValue,
        startDate,
        endDate,
        departmentTargets,
      } = input;

      if (
        !currentUser.permissions.includes('super_admin') &&
        !currentUser.permissions.includes('admin')
      ) {
        throw new HttpErrors.Forbidden('Only CEO can assign branch targets');
      }

      // 1. Create the branch-level target
      const branchTarget = await this.targetRepository.create(
        {
          branchId,
          targetValue,
          startDate: startDate,
          endDate: endDate,
          assignedByUserId: currentUser.id,
          cgmApproverUserId,
        },
        {transaction: tx},
      );

      // 2. Create related department-level targets
      const departmentTargetEntities = departmentTargets.map(dt => ({
        targetId: branchTarget.id,
        departmentId: dt.departmentId,
        targetValue: dt.targetValue,
      }));

      await this.departmentTargetRepository.createAll(
        departmentTargetEntities,
        {
          transaction: tx,
        },
      );

      await tx.commit();

      return {
        message: 'Branch and department targets assigned successfully',
        branchTarget,
        departmentsAssigned: departmentTargets.length,
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  @authenticate('jwt')
  @get('/targets')
  @response(200, {
    description: 'Array of Target model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Target, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.filter(Target) filter?: Filter<Target>,
  ): Promise<Target[]> {
    const isCGM = currentUser.permissions?.includes('cgm');
    const whereFilter = isCGM ? {cgmApproverUserId: currentUser.id} : {};
    return this.targetRepository.find({
      ...filter,
      where: {
        ...whereFilter,
        ...(filter?.where ?? {}),
      },
      include: [
        {
          relation: 'departmentTargets',
          scope: {
            include: [{relation: 'department'}],
          },
        },
        {relation: 'cgmApproverUser'},
        {
          relation: 'branch',
          scope: {
            include: [{relation: 'departments'}],
          },
        },
      ],
    });
  }

  @get('/targets/{id}')
  @response(200, {
    description: 'Target model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Target, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Target, {exclude: 'where'})
    filter?: FilterExcludingWhere<Target>,
  ): Promise<Target> {
    return this.targetRepository.findById(id, {
      ...filter,
      include: [
        {
          relation: 'departmentTargets',
          scope: {
            include: [{relation: 'department'}],
          },
        },
        {relation: 'cgmApproverUser'},
        {
          relation: 'branch',
          scope: {
            include: [{relation: 'departments'}],
          },
        },
      ],
    });
  }

  @authenticate('jwt')
  @patch('/targets/{id}')
  @response(200, {
    description: 'Target update response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'},
            updatedTarget: {type: 'object'},
          },
        },
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              targetValue: {type: 'number'},
              startDate: {type: 'string', format: 'date-time'},
              endDate: {type: 'string', format: 'date-time'},
              status: {type: 'number'},
              cgmApproverUserId: {type: 'number'},
              rejectedReason: {type: 'string'},
              departmentTargets: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['departmentId', 'targetValue'],
                  properties: {
                    departmentId: {type: 'number'},
                    targetValue: {type: 'number'},
                  },
                },
              },
            },
          },
        },
      },
    })
    input: {
      targetValue?: number;
      startDate?: string;
      endDate?: string;
      status?: number;
      cgmApproverUserId?: number;
      rejectedReason?: string;
      departmentTargets?: {departmentId: number; targetValue: number}[];
    },
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<object> {
    const repo = new DefaultTransactionalRepository(Target, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      if (
        !currentUser.permissions.includes('super_admin') &&
        !currentUser.permissions.includes('admin')
      ) {
        throw new HttpErrors.Forbidden('Only CEO can update targets');
      }

      // ✅ Clean input before updating the model
      const {departmentTargets, ...safeTargetData} = input;

      await this.targetRepository.updateById(
        id,
        {
          ...safeTargetData,
          updatedAt: new Date(),
        },
        {transaction: tx},
      );

      // ✅ Handle departmentTargets separately if provided
      if (departmentTargets) {
        await this.departmentTargetRepository.deleteAll(
          {targetId: id},
          {transaction: tx},
        );

        const newDeptTargets = departmentTargets.map(dt => ({
          targetId: id,
          departmentId: dt.departmentId,
          targetValue: dt.targetValue,
        }));

        await this.departmentTargetRepository.createAll(newDeptTargets, {
          transaction: tx,
        });
      }

      await tx.commit();

      const updatedTarget = await this.targetRepository.findById(id, {
        include: [
          {relation: 'departmentTargets'},
          {relation: 'cgmApproverUser'},
        ],
      });

      return {
        message: 'Target updated successfully',
        updatedTarget,
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  @authenticate('jwt')
  @patch('/targets/{id}/status')
  @response(200, {
    description: 'Target status update response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'},
            updatedStatus: {type: 'number'},
          },
        },
      },
    },
  })
  async updateTargetStatus(
    @param.path.number('id') targetId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status'],
            properties: {
              status: {type: 'number', enum: [1, 2]}, // 1 = approved, 2 = request change
              changeRequestReason: {type: 'string'},
            },
          },
        },
      },
    })
    input: {
      status: 1 | 2;
      changeRequestReason?: string;
    },

    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<object> {
    if (
      !['cgm', 'admin', 'super_admin'].some(role =>
        currentUser.permissions.includes(role),
      )
    ) {
      throw new HttpErrors.Forbidden(
        'You are not allowed to update target status.',
      );
    }

    const updatePayload: Partial<Target> = {
      status: input.status,
      updatedAt: new Date(),
    };

    // Only set rejectedReason if status is 2
    if (input.status === 2 && input.changeRequestReason) {
      updatePayload['requestChangeReason'] = input.changeRequestReason;
    }

    await this.targetRepository.updateById(targetId, updatePayload);

    return {
      message:
        input.status === 1
          ? 'Target approved successfully'
          : 'Target sent for changes',
      updatedStatus: input.status,
    };
  }

  @del('/targets/{id}')
  @response(204, {
    description: 'Target DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.targetRepository.deleteById(id);
  }

  @authenticate('jwt')
  @get('/department-target/{id}')
  @response(200, {
    description: 'Target model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Target, {includeRelations: true}),
      },
    },
  })
  async findByIdDepartmentTarget(
    @param.path.number('id') id: number,
    @param.filter(DepartmentTarget, {exclude: 'where'})
    filter?: FilterExcludingWhere<DepartmentTarget>,
  ): Promise<DepartmentTarget> {
    return this.departmentTargetRepository.findById(id, {
      ...filter,
      include: [
        {
          relation: 'department',
        },
        {
          relation: 'target',
          scope: {
            include: ['branch'],
          },
        },
        {
          relation: 'trainerTargets',
          scope: {
            include: ['trainer'],
          },
        },
      ],
    });
  }

  @post('/trainer-targets/assign')
  async assignTrainerTargets(
    @requestBody({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['departmentTargetId', 'trainerKpiTargets'],
            properties: {
              departmentTargetId: {type: 'number'},
              trainerKpiTargets: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['trainerId', 'kpiTargets'],
                  properties: {
                    trainerId: {type: 'number'},
                    kpiTargets: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['kpiId', 'targetValue'],
                        properties: {
                          kpiId: {type: 'number'},
                          targetValue: {type: 'number'},
                          trainerTargetId: {type: 'number'}, // optional for update
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    body: {
      departmentTargetId: number;
      trainerKpiTargets: {
        trainerId: number;
        kpiTargets: {
          kpiId: number;
          targetValue: number;
          trainerTargetId?: number;
        }[];
      }[];
    },
  ) {
    const {departmentTargetId, trainerKpiTargets} = body;
    const result = [];

    for (const {trainerId, kpiTargets} of trainerKpiTargets) {
      for (const {kpiId, targetValue, trainerTargetId} of kpiTargets) {
        if (trainerTargetId) {
          await this.trainerTargetRepository.updateById(trainerTargetId, {
            targetValue,
            updatedAt: new Date(),
          });
          result.push({trainerId, kpiId, trainerTargetId, updated: true});
        } else {
          const created = await this.trainerTargetRepository.create({
            departmentTargetId,
            trainerId,
            kpiId,
            targetValue,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
          });
          result.push({
            trainerId,
            kpiId,
            trainerTargetId: created.id,
            created: true,
          });
        }
      }
    }

    return {
      message: 'Trainer KPI targets processed successfully',
      count: result.length,
      data: result,
    };
  }
}
