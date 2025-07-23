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
  RestBindings,
  Response,
} from '@loopback/rest';
import {MembershipDetails, Sales} from '../models';
import {SalesRepository, UserRepository} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';
import {MyptMetrixDataSource} from '../datasources';
import ExcelJS, {Workbook} from 'exceljs';
import {Request as ExpressRequest} from 'express';
import multer from 'multer';

export class SalesController {
  constructor(
    @inject('datasources.myptMetrix')
    public dataSource: MyptMetrixDataSource,
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
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
  @post('/sales')
  @response(200, {
    description: 'Sales model instance',
    content: {'application/json': {schema: getModelSchemaRef(Sales)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sales, {
            title: 'NewSalesWithMembership',
            exclude: ['id'],
            includeRelations: true,
          }),
        },
      },
    })
    salesData: Omit<Sales, 'id'> & {membershipDetails?: MembershipDetails},
  ): Promise<Sales> {
    const repo = new DefaultTransactionalRepository(Sales, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const {membershipDetails, ...salesFields} = salesData;

      const createdSale = await this.salesRepository.create(salesFields, {
        transaction: tx,
      });

      if (membershipDetails) {
        await this.salesRepository
          .membershipDetails(createdSale.id)
          .create(membershipDetails, {transaction: tx});
      }

      await tx.commit();
      return this.salesRepository.findById(createdSale.id, {
        include: ['membershipDetails'],
      });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
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
  @get('/sales')
  @response(200, {
    description: 'Array of Sales model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Sales, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.filter(Sales) filter?: Filter<Sales>,
  ): Promise<Sales[]> {
    const user = await this.userRepository.findById(currentUser.id);
    const isCGM = user.permissions?.includes(PermissionKeys.CGM);
    const isHOD = user.permissions?.includes(PermissionKeys.HOD);

    const updatedFilter: Filter<Sales> = {
      ...filter,
      include: [
        {
          relation: 'branch',
          scope: {
            include: [
              {
                relation: 'departments',
              },
            ],
          },
        },
        {relation: 'department'},
        {relation: 'salesTrainer'},
        {relation: 'trainer'},
        {relation: 'membershipDetails'},
        {relation: 'kpi'},
      ],
      where: {
        ...(filter?.where ?? {}),
        isDeleted: false, // Always apply this
      },
    };

    // Add branch filter only for CGM or HOD
    if ((isCGM || isHOD) && user.branchId) {
      updatedFilter.where = {
        ...updatedFilter.where,
        branchId: user.branchId,
      };
    }

    return this.salesRepository.find(updatedFilter);
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
  @get('/sales/{id}')
  @response(200, {
    description: 'Sales model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Sales, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Sales, {exclude: 'where'})
    filter?: FilterExcludingWhere<Sales>,
  ): Promise<Sales> {
    return this.salesRepository.findById(id, {
      ...filter,
      include: [
        {
          relation: 'branch',
          scope: {
            include: [
              {
                relation: 'departments',
                scope: {
                  include: [{relation: 'kpis'}],
                },
              },
            ],
          },
        },
        {
          relation: 'department',
          scope: {
            include: [{relation: 'kpis'}],
          },
        },
        {relation: 'salesTrainer'},
        {relation: 'trainer'},
        {relation: 'membershipDetails'},
        {relation: 'kpi'},
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
  @patch('/sales/{id}')
  @response(204, {
    description: 'Sales PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sales, {
            partial: true,
            includeRelations: true,
          }),
        },
      },
    })
    sales: Partial<Sales> & {membershipDetails?: Partial<MembershipDetails>},
  ): Promise<void> {
    // 1. Destructure membershipDetails from sales
    const {membershipDetails, ...salesFields} = sales;

    await this.salesRepository.updateById(id, salesFields);

    if (membershipDetails) {
      const existingMembership = await this.salesRepository
        .membershipDetails(id)
        .get()
        .catch(() => null);

      if (existingMembership) {
        await this.salesRepository
          .membershipDetails(id)
          .patch(membershipDetails);
      } else {
        await this.salesRepository
          .membershipDetails(id)
          .create(membershipDetails);
      }
    }
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
  @del('/sales/{id}')
  @response(204, {
    description: 'Sales DELETE success',
  })
  async deleteById(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new HttpErrors.BadRequest('Sale Not Found');
    }

    await this.salesRepository.updateById(id, {
      isDeleted: true,
      deletedBy: currentUser.id,
      deletedAt: new Date(),
    });
  }

  @post('/export-template', {
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
              kpiId: {type: 'number'},
            },
            required: ['branchId', 'departmentId', 'kpiId'],
          },
        },
      },
    })
    requestBody: {branchId: number; departmentId: number; kpiId: number},

    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {
    const workbook = new Workbook();

    // Sheet 1: SalesAndMembershipDetails
    const salesSheet = workbook.addWorksheet('SalesAndMembershipDetails');
    salesSheet.addRow([
      'srNo',
      'memberName',
      'memberEmail',
      'memberContactNumber(971561127654)',
      'gender(male,female)',
      'salesPersonId',
      'trainerId',
      'trainingAt(academy,ladies,mixed,home,hybrid)',
      'memberType(new,rnl,upgrade,top_up,emi,viya_fit)',
      'sourceOfLead(leads_update,walkins,phoneins,whatsa_app_direct,website_form,google_ads,meta_ads,insta_direct_message,mypt_app,referral,outreach,total)',
      'membershipType(academy,gym,pt,home,reformer,ems,group,others)',
      'purchaseDate',
      'actualPrice',
      'discountedPrice',
      'validityDays',
      'freeDays',
      'freeSessions',
      'startDate',
      'expiryDate',
      'freezingDays',
    ]);

    // Sheet 2: Payments
    const paymentSheet = workbook.addWorksheet('Payments');
    paymentSheet.addRow([
      'srNoRefFromSales',
      'paymentAmount',
      'paymentMode(viya_app,mypt,cash,pos,bank,link,tabby,tamara,cheque,atm)',
      'paymentReceiptNumber',
    ]);

    // Sheet 3: Meta
    const metaSheet = workbook.addWorksheet('Meta');
    metaSheet.addRow(['branchId', 'departmentId', 'kpiId']);
    metaSheet.addRow([
      requestBody.branchId,
      requestBody.departmentId,
      requestBody.kpiId,
    ]);

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

  @post('/import-sales-template', {
    responses: {
      '200': {
        description: 'Import sales template from Excel',
        content: {'application/json': {schema: {type: 'object'}}},
      },
    },
  })
  async importExcel(
    @inject(RestBindings.Http.REQUEST) request: ExpressRequest,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise((resolve, reject) => {
      const storage = multer.memoryStorage();
      const upload = multer({storage}).single('file');

      upload(request, response, async err => {
        if (err || !request.file) {
          reject(new HttpErrors.BadRequest('File upload failed'));
          return;
        }

        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(request.file.buffer);

          const salesSheet: any = workbook.getWorksheet(
            'SalesAndMembershipDetails',
          );
          const paymentsSheet: any = workbook.getWorksheet('Payments');
          const metaSheet: any = workbook.getWorksheet('Meta');

          if (!salesSheet || !paymentsSheet || !metaSheet) {
            throw new HttpErrors.BadRequest('Missing required sheets');
          }

          // Extract Meta Info
          const metaHeaders = metaSheet.getRow(1).values.slice(1);
          const metaRow = metaSheet.getRow(2).values.slice(1);
          const meta: any = {};
          metaHeaders.forEach((key: any, idx: number) => {
            meta[key] = metaRow[idx] ?? null;
          });

          // Excel → Model field map
          const excelToModelMap: {[key: string]: string} = {
            srNo: 'srNo',
            memberName: 'memberName',
            memberEmail: 'email',
            'memberContactNumber(971561127654)': 'contactNumber',
            'gender(male,female)': 'gender',
            salesPersonId: 'salesTrainerId',
            trainerId: 'trainerId',
            'trainingAt(academy,ladies,mixed,home,hybrid)': 'trainingAt',
            'memberType(new,rnl,upgrade,top_up,emi,viya_fit)': 'memberType',
            'sourceOfLead(leads_update,walkins,phoneins,whatsa_app_direct,website_form,google_ads,meta_ads,insta_direct_message,mypt_app,referral,outreach,total)':
              'sourceOfLead',
            'membershipType(academy,gym,pt,home,reformer,ems,group,others)':
              'membershipType',
            purchaseDate: 'purchaseDate',
            actualPrice: 'actualPrice',
            discountedPrice: 'discountedPrice',
            validityDays: 'validityDays',
            freeDays: 'freeDays',
            freeSessions: 'freeSessions',
            startDate: 'startDate',
            expiryDate: 'expiryDate',
            freezingDays: 'freezingDays',
          };

          const membershipFields = [
            'membershipType',
            'purchaseDate',
            'actualPrice',
            'discountedPrice',
            'validityDays',
            'freeDays',
            'freeSessions',
            'startDate',
            'expiryDate',
            'freezingDays',
          ];

          const salesHeaders = salesSheet.getRow(1).values.slice(1);
          const paymentHeaders = paymentsSheet.getRow(1).values.slice(1);

          const sales: any[] = [];
          const payments: any[] = [];

          // Parse Sales Sheet
          for (let i = 2; i <= salesSheet.rowCount; i++) {
            
            const row = salesSheet.getRow(i);
            const raw: any = {};
            const membershipDetails: any = {};

            salesHeaders.forEach((header: any, idx: number) => {
              const mappedKey = excelToModelMap[header];
              if (!mappedKey) return;

              const value = row.getCell(idx + 1).value ?? null;

              if (membershipFields.includes(mappedKey)) {
                membershipDetails[mappedKey] = value;
              } else {
                raw[mappedKey] = value;
              }
            });

            if (!raw.srNo) continue;

            const finalSale = {
              ...raw,
              branchId: meta.branchId,
              departmentId: meta.departmentId,
              kpiId: meta.kpiId,
              deletedBy: null,
              membershipDetails,
            };

            sales.push(finalSale);
          }

          // Parse Payments Sheet
          for (let i = 2; i <= paymentsSheet.rowCount; i++) {
            const row = paymentsSheet.getRow(i);
            const payment: any = {};
            paymentHeaders.forEach((header: any, idx: number) => {
              payment[header] = row.getCell(idx + 1).value ?? null;
            });
            if (payment.srNoRefFromSales) payments.push(payment);
          }

          // Map payments to sales by srNo
          const salesWithPayments = sales.map(sale => {
            const relatedPayments = payments.filter(
              p => String(p.srNoRefFromSales) === String(sale.srNo),
            );
            return {
              ...sale,
              paymentTypes: relatedPayments,
            };
          });

          resolve({meta, sales: salesWithPayments});
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
