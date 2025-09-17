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
  RestBindings,
  Response,
} from '@loopback/rest';
import { Conduction, ConductionWithRelations } from '../models';
import { ConductionRepository, UserRepository } from '../repositories';
import { TrainerRepository } from '../repositories';
import { BranchRepository } from '../repositories';
import { DepartmentRepository } from '../repositories';
import { KpiRepository } from '../repositories';
import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { PermissionKeys } from '../authorization/permission-keys';
import { inject } from '@loopback/core';
import { UserProfile } from '@loopback/security';
import ExcelJS, { Workbook } from 'exceljs';
import { Request as ExpressRequest } from 'express';
import multer from 'multer';

export class ConductionController {
  constructor(
    @repository(ConductionRepository)
    public conductionRepository: ConductionRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(TrainerRepository)
    public trainerRepository: TrainerRepository,

    @repository(BranchRepository)
    public branchRepository: BranchRepository,

    @repository(DepartmentRepository)
    public departmentRepository: DepartmentRepository,

    @repository(KpiRepository)
    public kpiRepository: KpiRepository,
  ) { }

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
    content: { 'application/json': { schema: getModelSchemaRef(Conduction) } },
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
    description: 'Paginated & searchable list of Conduction instances (search by trainer name only)',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(Conduction, { includeRelations: true }),
            },
            total: { type: 'number' },
            page: { type: 'number' },
            rowsPerPage: { type: 'number' },
          },
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.query.number('page') page = 1,
    @param.query.number('rowsPerPage') rowsPerPage = 25,
    @param.query.string('search') search?: string,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
  ): Promise<{ data: ConductionWithRelations[]; total: number; page: number; rowsPerPage: number }> {

    const where: any = { isDeleted: false };

    // Apply proper 'between' date filter if startDate and/or endDate exist
    if (startDate && endDate) {
      const start = startDate
        ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
        : undefined;
      const end = endDate
        ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
        : undefined;

      if (start && end) {
        // Both start and end exist
        where.conductionDate = { between: [start, end] };
      } else if (start) {
        // Only start date provided
        where.conductionDate = { gte: start };
      } else if (end) {
        // Only end date provided
        where.conductionDate = { lte: end };
      }
    }

    // Fetch with relations
    const allConductions: ConductionWithRelations[] = await this.conductionRepository.find({
      where,
      include: [
        { relation: 'trainer' },
        { relation: 'branch' },
        { relation: 'department' },
        { relation: 'kpi' },
        { relation: 'deletedByUser' },
      ],
      order: ['conductionDate ASC'],
    });

    let filtered = allConductions;

    if (search && search.trim() !== '') {
      const lower = search.toLowerCase().trim();

      filtered = filtered.filter(c => {
        const first = (c.trainer?.firstName ?? '').toLowerCase().trim();
        const last = (c.trainer?.lastName ?? '').toLowerCase().trim();
        const full = `${first} ${last}`.trim();

        return (
          first.includes(lower) ||
          last.includes(lower) ||
          full.includes(lower)
        );
      });
    }

    const total = filtered.length;
    const skip = (page - 1) * rowsPerPage;
    const data = filtered.slice(skip, skip + rowsPerPage);

    return { data, total, page, rowsPerPage };
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
        schema: getModelSchemaRef(Conduction, { includeRelations: true }),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Conduction, { exclude: 'where' })
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
          schema: getModelSchemaRef(Conduction, { partial: true }),
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

  @authenticate('jwt')
  @post('/conduction/export-template', {
    responses: {
      description: 'Excel Template Download',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: { type: 'string', format: 'binary' },
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
              branchId: { type: 'number' },
              departmentId: { type: 'number' },
            },
            required: ['branchId', 'departmentId'],
          },
        },
      },
    })
    requestBody: { branchId: number; departmentId: number },

    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {
    const workbook = new Workbook();

    // Sheet 1: SalesAndMembershipDetails
    const conductionSheet = workbook.addWorksheet('Conductions');
    conductionSheet.addRow([
      'srNo',
      'conductionDate',
      'conductions',
      'trainerId',
      'kpiId',
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

  @authenticate('jwt')
  @post('/import-conduction-template', {
    responses: {
      '200': {
        description: 'Import conduction template from Excel',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  })
  async importConductionExcel(
    @inject(RestBindings.Http.REQUEST) request: ExpressRequest,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise((resolve, reject) => {
      const storage = multer.memoryStorage();
      const upload = multer({ storage }).single('file');

      upload(request, response, async err => {
        if (err || !request.file) {
          reject(new HttpErrors.BadRequest('File upload failed'));
          return;
        }

        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(request.file.buffer);

          const conductionSheet: any = workbook.getWorksheet('Conductions');
          const metaSheet: any = workbook.getWorksheet('Meta');

          if (!conductionSheet || !metaSheet) {
            throw new HttpErrors.BadRequest('Missing required sheets');
          }

          // Extract meta info
          const metaHeaders = metaSheet.getRow(1).values.slice(1);
          const metaValues = metaSheet.getRow(2).values.slice(1);
          const meta: any = {};
          metaHeaders.forEach((key: any, idx: any) => {
            meta[key] = metaValues[idx] ?? null;
          });

          const headers = conductionSheet.getRow(1).values.slice(1); // skip first cell
          const conductionData: any[] = [];

          for (let i = 2; i <= conductionSheet.rowCount; i++) {
            const row = conductionSheet.getRow(i);
            if (
              row.cellCount === 0 ||
              row.values.every((v: any) => v == null || v === '')
            )
              continue;

            const conduction: any = {};

            headers.forEach((header: any, idx: any) => {
              const cellValue = row.getCell(idx + 1).value ?? null;
              conduction[header] = cellValue;
            });

            if (!conduction.srNo || !conduction.conductionDate) continue;

            conductionData.push({
              conductionDate: new Date(conduction.conductionDate),
              conductions: conduction.conductions,
              trainerId: conduction.trainerId,
              kpiId: conduction.kpiId,
              branchId: meta.branchId,
              departmentId: meta.departmentId,
            });
          }

          // Save all conductions in DB
          const result =
            await this.conductionRepository.createAll(conductionData);

          resolve({
            importedCount: result.length,
            skippedCount: conductionSheet.rowCount - 1 - result.length,
          });
        } catch (error) {
          console.error(error);
          reject(new HttpErrors.InternalServerError('Import failed'));
        }
      });
    });
  }
}
