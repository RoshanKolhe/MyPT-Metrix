import {
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
  RestBindings,
  Response,
} from '@loopback/rest';
import {Trainer} from '../models';
import {
  DepartmentTrainerRepository,
  TrainerRepository,
  UserRepository,
} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';
import {Request as ExpressRequest} from 'express';
import multer from 'multer';
import ExcelJS, {Workbook} from 'exceljs';
import {MyptMetrixDataSource} from '../datasources';

export class TrainerController {
  constructor(
    @inject('datasources.myptMetrix')
    public dataSource: MyptMetrixDataSource,
    @repository(TrainerRepository)
    public trainerRepository: TrainerRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(DepartmentTrainerRepository)
    public departmentTrainerRepository: DepartmentTrainerRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.HOD,
        PermissionKeys.CGM,
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
          schema: {
            type: 'object',
            properties: {
              firstName: {type: 'string'},
              lastName: {type: 'string'},
              email: {type: 'string'},
              phoneNumber: {type: 'string'},
              dob: {type: 'string'},
              isActive: {type: 'boolean'},
              avatar: {
                type: 'object',
                properties: {
                  fileUrl: {type: 'string'},
                },
              },
              branchId: {type: 'number'},
              departmentIds: {
                type: 'array',
                items: {type: 'number'},
              },
              supervisorId: {type: 'number'},
            },
          },
        },
      },
    })
    body: Omit<Trainer, 'id'> & {departmentIds: number[]},
  ): Promise<Trainer> {
    const {departmentIds, ...trainerData} = body;

    // Check for duplicate phone/email
    const existingTrainer = await this.trainerRepository.findOne({
      where: {
        or: [
          {phoneNumber: trainerData.phoneNumber},
          {email: trainerData.email},
        ],
      },
    });

    if (existingTrainer) {
      throw new HttpErrors.BadRequest(
        'A staff with the same phone number or email already exists.',
      );
    }

    // Create trainer
    const trainer = await this.trainerRepository.create(trainerData);

    // Assign departments via hasManyThrough relation
    if (departmentIds?.length) {
      for (const depId of departmentIds) {
        await this.trainerRepository.departments(trainer.id).link(depId);
      }
    }

    return trainer;
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
        {relation: 'departments'},
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
        {relation: 'departments'},
        {
          relation: 'branch',
          scope: {
            include: ['departments'],
          },
        },
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
          schema: {
            type: 'object',
            properties: {
              firstName: {type: 'string'},
              lastName: {type: 'string'},
              email: {type: 'string'},
              phoneNumber: {type: 'string'},
              dob: {type: 'string'},
              isActive: {type: 'boolean'},
              avatar: {
                type: 'object',
                properties: {
                  fileUrl: {type: 'string'},
                },
              },
              branchId: {type: 'number'},
              departmentIds: {
                type: 'array',
                items: {type: 'number'},
              },
              supervisorId: {type: 'number'},
            },
          },
        },
      },
    })
    body: Partial<Trainer> & {departmentIds?: number[]},
  ): Promise<void> {
    const repo = new DefaultTransactionalRepository(Trainer, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const {departmentIds, ...trainerData} = body;
      if (trainerData.email || trainerData.phoneNumber) {
        const existingTrainer = await this.trainerRepository.findOne({
          where: {
            and: [
              {
                or: [
                  trainerData.email ? {email: trainerData.email} : {},
                  trainerData.phoneNumber
                    ? {phoneNumber: trainerData.phoneNumber}
                    : {},
                ],
              },
              {id: {neq: id}},
            ],
          },
        });

        if (existingTrainer) {
          throw new HttpErrors.BadRequest(
            'Another staff with the same phone number or email already exists.',
          );
        }
      }
      await this.trainerRepository.updateById(id, trainerData, {
        transaction: tx,
      });
      console.log(departmentIds);

      if (Array.isArray(departmentIds) && departmentIds.length > 0) {
        await this.departmentTrainerRepository.deleteAll(
          {trainerId: id},
          {transaction: tx},
        );

        for (const depId of departmentIds) {
          console.log('Linking department', depId);
          console.log('ID', id);
          await this.departmentTrainerRepository.create(
            {
              trainerId: id,
              departmentId: depId,
            },
            {transaction: tx},
          );
        }
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
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
        branchId, // still directly in Trainer model
        isDeleted: false,
        isActive: true,
      },
      include: [
        {
          relation: 'departments', // hasManyThrough relation
          scope: {
            where: {id: departmentId},
            include: ['kpis'],
          },
        },
      ],
    });

    return trainers.filter(t => t.departments && t.departments.length > 0);
  }

  @authenticate('jwt')
  @post('/staff/export-template', {
    responses: {
      description: 'Excel Template Download',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: {type: 'string', format: 'binary'},
        },
      },
    },
  })
  async exportTemplate(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              branchId: {type: 'number'},
              departmentId: {type: 'number'},
            },
            required: ['branchId', 'departmentId'],
          },
        },
      },
    })
    requestBody: {branchId: number; departmentId: number},

    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {
    const workbook = new Workbook();

    // Sheet 1: SalesAndMembershipDetails
    const salesSheet = workbook.addWorksheet('StaffDetails');
    salesSheet.addRow([
      'srNo',
      'firstName',
      'lastName',
      'dob',
      'email',
      'phoneNumber',
      'supervisorId',
    ]);

    // Sheet 3: Meta
    const metaSheet = workbook.addWorksheet('Meta');
    metaSheet.addRow(['branchId', 'departmentId']);
    metaSheet.addRow([requestBody.branchId, requestBody.departmentId]);

    // Set headers and return Excel file
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=template.xlsx',
    );

    await workbook.xlsx.write(response);
    return response;
  }

  @post('/import-staff-template')
  @response(200, {
    description: 'Trainer import result',
    content: {'application/json': {schema: {type: 'object'}}},
  })
  async importTrainers(
    @inject(RestBindings.Http.REQUEST) request: ExpressRequest,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    const storage = multer.memoryStorage();
    const upload = multer({storage}).single('file');

    return new Promise((resolve, reject) => {
      upload(request, response, async err => {
        if (err || !request.file) {
          reject(new HttpErrors.BadRequest('File upload failed'));
          return;
        }

        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(request.file.buffer);

          const staffSheet: any = workbook.getWorksheet('StaffDetails');
          const metaSheet: any = workbook.getWorksheet('Meta');

          if (!staffSheet || !metaSheet) {
            throw new HttpErrors.BadRequest('Missing required sheets');
          }

          // Extract Meta Info
          const metaHeaders = metaSheet.getRow(1).values.slice(1);
          const metaRow = metaSheet.getRow(2).values.slice(1);
          const meta: any = {};
          metaHeaders.forEach((key: any, idx: number) => {
            meta[key] = metaRow[idx] ?? null;
          });

          const staffHeaders = staffSheet.getRow(1).values.slice(1);
          const trainers: any[] = [];
          let skipped = 0;

          for (let i = 2; i <= staffSheet.rowCount; i++) {
            const row = staffSheet.getRow(i);
            const isEmpty = row.values
              .slice(1)
              .every((cell: any) => cell === null || cell === '');
            if (isEmpty) {
              continue;
            }
            const trainerData: any = {
              branchId: meta.branchId,
              departmentId: meta.departmentId,
              isActive: true,
              isDeleted: false,
            };

            staffHeaders.forEach((header: any, idx: number) => {
              const cellValue = row.getCell(idx + 1).value ?? null;
              trainerData[header] = cellValue;
            });

            if (!trainerData.phoneNumber || !trainerData.email) {
              skipped++;
              continue;
            }

            // Validate supervisorId if present
            if (trainerData.supervisorId) {
              const supervisorExists = await this.userRepository.findById(
                trainerData.supervisorId,
              );
              if (!supervisorExists) {
                skipped++;
                continue;
              }
            }

            try {
              const existing = await this.trainerRepository.findOne({
                where: {
                  or: [
                    {email: trainerData.email},
                    {phoneNumber: trainerData.phoneNumber},
                  ],
                },
              });
              if (existing) {
                console.log(
                  `Skipped row ${i} - email or phone number already exists: ${trainerData.email} / ${trainerData.phoneNumber}`,
                );
                skipped++;
                continue;
              }
              delete trainerData.srNo;
              const created = await this.trainerRepository.create(trainerData);
              trainers.push(created);
            } catch (err) {
              console.log(
                `Skipped srNo: ${trainerData.srNo} due to error:`,
                err.message,
              );
              skipped++;
            }
          }

          resolve({
            importedCount: trainers.length,
            skippedCount: skipped,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
