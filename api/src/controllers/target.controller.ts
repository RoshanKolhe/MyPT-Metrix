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
  DepartmentRepository,
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
    @repository(DepartmentRepository)
    public departmentRepository: DepartmentRepository,
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
                  required: ['departmentId', 'kpiId', 'targetValue'],
                  properties: {
                    departmentId: {type: 'number'},
                    kpiId: {type: 'number'},
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
      departmentTargets: {
        departmentId: number;
        kpiId: number;
        targetValue: number;
      }[];
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

      const branchTarget = await this.targetRepository.create(
        {
          branchId,
          targetValue,
          startDate,
          endDate,
          assignedByUserId: currentUser.id,
          cgmApproverUserId,
        },
        {transaction: tx},
      );

      const departmentTargetEntities = departmentTargets.map(dt => ({
        targetId: branchTarget.id,
        departmentId: dt.departmentId,
        kpiId: dt.kpiId,
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
        message: 'Branch and department KPI targets assigned successfully',
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
    const isHOD = currentUser.permissions?.includes('hod');

    let whereFilter: any = {};
    if (isCGM) {
      whereFilter.cgmApproverUserId = currentUser.id;
    } else if (isHOD) {
      whereFilter.branchId = currentUser.branchId;
    }

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
            include: [
              {
                relation: 'department',
              },
            ],
          },
        },
        {relation: 'cgmApproverUser'},
        {
          relation: 'branch',
          scope: {
            include: [
              {
                relation: 'departments',
                scope: {
                  include: ['kpis'],
                },
              },
            ],
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
            include: [
              {
                relation: 'departments',
                scope: {
                  include: ['kpis'],
                },
              },
            ],
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
                  required: ['departmentId', 'kpiId', 'targetValue'],
                  properties: {
                    departmentId: {type: 'number'},
                    kpiId: {type: 'number'},
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
      departmentTargets?: {
        departmentId: number;
        kpiId: number;
        targetValue: number;
      }[];
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

      const {departmentTargets, ...safeTargetData} = input;

      await this.targetRepository.updateById(
        id,
        {
          ...safeTargetData,
          updatedAt: new Date(),
        },
        {transaction: tx},
      );

      // ✅ Handle departmentTargets with kpiId
      if (departmentTargets) {
        // Remove all existing department+kpi targets for this target
        await this.departmentTargetRepository.deleteAll(
          {targetId: id},
          {transaction: tx},
        );

        // Add new departmentTargets with kpiId
        const newDeptTargets = departmentTargets.map(dt => ({
          targetId: id,
          departmentId: dt.departmentId,
          kpiId: dt.kpiId,
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
  @get('/department-targets/{departmentId}/{targetId}')
  @response(200, {
    description: 'List of DepartmentTarget with relations',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DepartmentTarget, {includeRelations: true}),
        },
      },
    },
  })
  async findDepartmentTargets(
    @param.path.number('departmentId') departmentId: number,
    @param.path.number('targetId') targetId: number,
  ): Promise<any> {
    const target = await this.targetRepository.findById(targetId);
    const department = await this.departmentRepository.findById(departmentId);
    const departmentTargets = await this.departmentTargetRepository.find({
      where: {
        departmentId,
        targetId,
      },
      include: [
        {relation: 'department'},
        {
          relation: 'trainerTargets',
          scope: {
            include: ['trainer', 'kpi'],
          },
        },
        {relation: 'kpi'},
      ],
    });

    return Promise.resolve({
      success: true,
      data: {target, departmentTargets, department},
    });
  }

  @post('/trainer-targets/assign')
  @response(200, {
    description: 'Trainer KPI targets processed successfully',
    content: {'application/json': {schema: {type: 'object'}}},
  })
  async assignTrainerTargets(
    @requestBody({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['trainerKpiTargets'],
            properties: {
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
                        required: [
                          'kpiId',
                          'targetValue',
                          'departmentTargetId',
                        ],
                        properties: {
                          kpiId: {type: 'number'},
                          departmentTargetId: {type: 'number'},
                          targetValue: {type: 'number'},
                          trainerTargetId: {type: 'number'}, // optional
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
      trainerKpiTargets: {
        trainerId: number;
        kpiTargets: {
          kpiId: number;
          departmentTargetId: number;
          targetValue: number;
          trainerTargetId?: number;
        }[];
      }[];
    },
  ): Promise<{
    message: string;
    count: number;
    data: {
      trainerId: number;
      kpiId: number;
      departmentTargetId: number;
      trainerTargetId: number;
      created?: boolean;
      updated?: boolean;
    }[];
  }> {
    const {trainerKpiTargets} = body;
    const result: {
      trainerId: number;
      kpiId: number;
      departmentTargetId: number;
      trainerTargetId: number;
      created?: boolean;
      updated?: boolean;
    }[] = [];

    const tx = await this.trainerTargetRepository.dataSource.beginTransaction(
      IsolationLevel.READ_COMMITTED,
    );

    try {
      const repo = this.trainerTargetRepository;

      for (const {trainerId, kpiTargets} of trainerKpiTargets) {
        for (const {
          kpiId,
          targetValue,
          departmentTargetId,
          trainerTargetId,
        } of kpiTargets) {
          if (trainerTargetId) {
            await repo.updateById(
              trainerTargetId,
              {
                targetValue,
                updatedAt: new Date(),
              },
              {transaction: tx},
            );
            result.push({
              trainerId,
              kpiId,
              departmentTargetId,
              trainerTargetId,
              updated: true,
            });
          } else {
            const created = await repo.create(
              {
                departmentTargetId,
                trainerId,
                kpiId,
                targetValue,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
              },
              {transaction: tx},
            );
            result.push({
              trainerId,
              kpiId,
              departmentTargetId,
              trainerTargetId: created.id!,
              created: true,
            });
          }
        }
      }

      await tx.commit();

      return {
        message: 'Trainer KPI targets processed successfully',
        count: result.length,
        data: result,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}
