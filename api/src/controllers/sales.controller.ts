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
import { MembershipDetails, Sales } from '../models';
import {
  SalesRepository,
  TrainerRepository,
  UserRepository,
} from '../repositories';
import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { PermissionKeys } from '../authorization/permission-keys';
import { inject } from '@loopback/core';
import { UserProfile } from '@loopback/security';
import { MyptMetrixDataSource } from '../datasources';
import ExcelJS, { Workbook } from 'exceljs';
import { Request as ExpressRequest } from 'express';
import multer from 'multer';

export class SalesController {
  constructor(
    @inject('datasources.myptMetrix')
    public dataSource: MyptMetrixDataSource,
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(TrainerRepository)
    public trainerRepository: TrainerRepository,
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
  @post('/sales')
  @response(200, {
    description: 'Sales model instance',
    content: { 'application/json': { schema: getModelSchemaRef(Sales) } },
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
    salesData: Omit<Sales, 'id'> & { membershipDetails?: MembershipDetails },
  ): Promise<Sales> {
    const repo = new DefaultTransactionalRepository(Sales, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const { membershipDetails, ...salesFields } = salesData;

      const createdSale = await this.salesRepository.create(salesFields, {
        transaction: tx,
      });

      if (membershipDetails) {
        await this.salesRepository
          .membershipDetails(createdSale.id)
          .create(membershipDetails, { transaction: tx });
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
  description: 'Paginated & Searchable Sales list with membership purchase date filter',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: getModelSchemaRef(Sales, { includeRelations: true }),
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
  @param.query.number('page') page: number = 1,
  @param.query.number('rowsPerPage') rowsPerPage: number = 25,
  @param.query.string('search') search?: string,
  @param.query.string('startDate') startDate?: string,
  @param.query.string('endDate') endDate?: string,
  @param.query.boolean('export') exportFlag?: boolean, // export flag
  @param.filter(Sales) filter?: Filter<Sales>,
): Promise<{ data: Sales[]; total: number; page: number; rowsPerPage: number }> {

  const user = await this.userRepository.findById(currentUser.id);
  const isCGM = user.permissions?.includes(PermissionKeys.CGM);
  const isHOD = user.permissions?.includes(PermissionKeys.HOD);

  // Base filter for Sales
  const salesWhere: any = {
    ...(filter?.where ?? {}),
    isDeleted: false,
  };

  // Search filter
  if (search) {
    salesWhere.or = [
      { memberName: { like: `%${search}%`, options: 'i' } },
      { contactNumber: { like: `%${search}%`, options: 'i' } },
      { email: { like: `%${search}%`, options: 'i' } },
    ];
  }

  // Branch filter for CGM/HOD
  if ((isCGM || isHOD) && user.branchId) {
    salesWhere.branchId = user.branchId;
  }

  // Membership date filter inside include.scope
  const membershipScope: any = {};
  if (startDate || endDate) {
    membershipScope.where = {};
    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : undefined;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : undefined;

    if (start && end) {
      membershipScope.where.purchaseDate = { between: [start, end] };
    } else if (start) {
      membershipScope.where.purchaseDate = { gte: start };
    } else if (end) {
      membershipScope.where.purchaseDate = { lte: end };
    }
  }

  // Fetch all filtered data first (without skip/limit)
  const allFiltered: Sales[] = await this.salesRepository.find({
    where: salesWhere,
    include: [
      { relation: 'branch', scope: { include: [{ relation: 'departments' }] } },
      { relation: 'department' },
      { relation: 'salesTrainer' },
      { relation: 'trainer' },
      { relation: 'membershipDetails', scope: membershipScope },
      { relation: 'kpi' },
    ],
  });

  // Filter sales based on membershipDetails date range
  const filteredData = allFiltered.filter(sale => {
    if (!sale.membershipDetails) return false;

    const mdList = Array.isArray(sale.membershipDetails)
      ? sale.membershipDetails
      : [sale.membershipDetails];

    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime() : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime() : null;

    return mdList.some(md => {
      if (!md?.purchaseDate) return false;
      const purchaseTime = new Date(md.purchaseDate).getTime();
      if (start && purchaseTime < start) return false;
      if (end && purchaseTime > end) return false;
      return true;
    });
  });

  const total = filteredData.length;

  // ✅ Handle export: return all filtered rows if exportFlag is true
  const dataToReturn = exportFlag
    ? filteredData
    : filteredData.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);

  return {
    data: dataToReturn,
    total,
    page,
    rowsPerPage: exportFlag ? total : rowsPerPage,
  };
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
        schema: getModelSchemaRef(Sales, { includeRelations: true }),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Sales, { exclude: 'where' })
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
                  include: [{ relation: 'kpis' }],
                },
              },
            ],
          },
        },
        {
          relation: 'department',
          scope: {
            include: [{ relation: 'kpis' }],
          },
        },
        { relation: 'salesTrainer' },
        { relation: 'trainer' },
        { relation: 'membershipDetails' },
        { relation: 'kpi' },
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
    sales: Partial<Sales> & { membershipDetails?: Partial<MembershipDetails> },
  ): Promise<void> {
    // 1. Destructure membershipDetails from sales
    const { membershipDetails, ...salesFields } = sales;

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

  @authenticate('jwt')
  @post('/export-template', {
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
    const salesSheet = workbook.addWorksheet('SalesAndMembershipDetails');
    salesSheet.addRow([
      'srNo',
      'kpiId',
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
      'sessions',
      'startDate',
      'expiryDate',
      'freezingDays',
      'country',
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
  @post('/import-sales-template', {
    responses: {
      '200': {
        description: 'Import sales template from Excel',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  })
  async importExcel(
    @inject(RestBindings.Http.REQUEST) request: ExpressRequest,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise((resolve, reject) => {
      const storage = multer.memoryStorage();
      const upload = multer({ storage }).single('file');

      upload(request, response, async err => {
        if (err || !request.file) {
          return reject(new HttpErrors.BadRequest('File upload failed'));
        }

        try {
          console.time('excel-load');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(request.file.buffer);
          console.timeEnd('excel-load');

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

          // Map definitions
          const excelToModelMap: { [key: string]: string } = {
            srNo: 'srNo',
            memberName: 'memberName',
            memberEmail: 'email',
            'memberContactNumber(971561127654)': 'contactNumber',
            'gender(male,female)': 'gender',
            salesPersonId: 'salesTrainerId',
            trainerId: 'trainerId',
            'trainingAt(academy,ladies,mixed,home,hybrid)': 'trainingAt',
            'memberType(new,rnl,upgrade,top_up,emi,viya_fit)': 'memberType',
            'sourceOfLead(leads_update,walkins,phoneins,whatsa_app_direct,whatsa_app_direct_form,google_ads,meta_ads,insta_direct_message,mypt_app,referral,outreach,total)':
              'sourceOfLead',
            'membershipType(academy,gym,pt,home,reformer,ems,group,others)':
              'membershipType',
            purchaseDate: 'purchaseDate',
            actualPrice: 'actualPrice',
            discountedPrice: 'discountedPrice',
            validityDays: 'validityDays',
            freeDays: 'freeDays',
            freeSessions: 'freeSessions',
            sessions: 'noOfSessions',
            startDate: 'startDate',
            expiryDate: 'expiryDate',
            freezingDays: 'freezingDays',
            country: 'country',
            kpiId: 'kpiId',
          };

          const paymentExcelToModelMap: { [key: string]: string } = {
            srNoRefFromSales: 'srNoRefFromSales',
            paymentAmount: 'amount',
            paymentReceiptNumber: 'paymentReceiptNumber',
            'paymentMode(viya_app,mypt,cash,pos,bank,link,tabby,tamara,cheque,atm)':
              'paymentMode',
          };

          const membershipFields = [
            'membershipType',
            'purchaseDate',
            'actualPrice',
            'discountedPrice',
            'validityDays',
            'freeDays',
            'freeSessions',
            'noOfSessions',
            'startDate',
            'expiryDate',
            'freezingDays',
          ];

          const membershipTypeOptions = [
            { label: 'Academy', value: 'academy' },
            { label: 'Gym Membership', value: 'gym' },
            { label: 'PT Membership', value: 'pt' },
            { label: 'Home Membership', value: 'home' },
            { label: 'Reformer Pilates', value: 'reformer' },
            { label: 'EMS Only', value: 'ems' },
            { label: 'Group Ex Only', value: 'group' },
            { label: 'Others', value: 'others' },
          ];

          const salesHeaders = salesSheet.getRow(1).values.slice(1);
          const paymentHeaders = paymentsSheet.getRow(1).values.slice(1);

          const sales: any[] = [];
          const payments: any[] = [];

          // Parse sales
          for (let i = 2; i <= salesSheet.rowCount; i++) {
            const row = salesSheet.getRow(i);
            const raw: any = {};
            const membershipDetails: any = {};

            salesHeaders.forEach((header: any, idx: number) => {
              const mappedKey = excelToModelMap[header];
              if (!mappedKey) return;

              const value = row.getCell(idx + 1).value ?? null;

              if (membershipFields.includes(mappedKey)) {
                if (
                  mappedKey === 'membershipType' &&
                  typeof value === 'string'
                ) {
                  const selectedValues = value.split(',').map(v => v.trim());
                  membershipDetails[mappedKey] = membershipTypeOptions.filter(
                    opt => selectedValues.includes(opt.value),
                  );
                } else {
                  membershipDetails[mappedKey] = value;
                }
              } else {
                raw[mappedKey] = value;
              }
            });

            if (!raw.srNo) continue;

            sales.push({
              ...raw,
              branchId: meta.branchId,
              departmentId: meta.departmentId,
              deletedBy: null,
              membershipDetails,
            });

            if (i % 100 === 0) await new Promise(r => setImmediate(r)); // yield
          }

          // Parse payments
          for (let i = 2; i <= paymentsSheet.rowCount; i++) {
            const row = paymentsSheet.getRow(i);
            const payment: any = {};
            paymentHeaders.forEach((header: any, idx: number) => {
              const mappedKey = paymentExcelToModelMap[header];
              if (mappedKey) {
                payment[mappedKey] = row.getCell(idx + 1).value ?? null;
              }
            });
            if (payment.srNoRefFromSales) payments.push(payment);
          }

          let importedCount = 0;
          let skippedCount = 0;

          // Process each sale individually
          for (const sale of sales) {
            const repo = new DefaultTransactionalRepository(
              Sales,
              this.dataSource,
            );
            const tx = await repo.beginTransaction(
              IsolationLevel.READ_COMMITTED,
            );

            try {
              const relatedPayments = payments.filter(
                p => String(p.srNoRefFromSales) === String(sale.srNo),
              );

              const finalPayload = { ...sale, paymentTypes: relatedPayments };

              if (!this.validateSale(finalPayload)) {
                skippedCount++;
                await tx.rollback();
                continue;
              }

              const { srNo, membershipDetails, ...salesFields } = finalPayload;

              const salesTrainer = await this.trainerRepository.findById(
                salesFields.salesTrainerId,
              );
              if (!salesTrainer) throw new Error('Invalid salesTrainerId.');

              if (salesFields.trainerId) {
                const trainer = await this.trainerRepository
                  .findById(salesFields.trainerId)
                  .catch(() => null);
                if (!trainer) throw new Error('Invalid trainerId.');
              }

              const createdSale = await this.salesRepository.create(
                salesFields,
                { transaction: tx },
              );

              if (membershipDetails) {
                await this.salesRepository
                  .membershipDetails(createdSale.id)
                  .create(membershipDetails, { transaction: tx });
              }

              await tx.commit();
              importedCount++;
            } catch (recordErr) {
              console.error(
                `Skipping sale SR: ${sale.srNo} - Error:`,
                recordErr.message,
              );
              skippedCount++;
              await tx.rollback();
              continue;
            }
          }

          return resolve({ importedCount, skippedCount });
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  validateSale(sale: any): boolean {
    const allowedValues = {
      gender: ['male', 'female'],
      trainingAt: ['academy', 'ladies', 'mixed', 'home', 'hybrid'],
      memberType: ['new', 'rnl', 'upgrade', 'top_up', 'emi', 'viya_fit'],
      sourceOfLead: [
        'leads_update',
        'walkins',
        'phoneins',
        'whatsa_app_direct',
        'website_form',
        'google_ads',
        'meta_ads',
        'insta_direct_message',
        'mypt_app',
        'referral',
        'outreach',
        'total',
      ],
      membershipType: [
        'academy',
        'gym',
        'pt',
        'home',
        'reformer',
        'ems',
        'group',
        'others',
      ],
    };

    if (
      !sale.memberName ||
      !sale.contactNumber ||
      !sale.salesTrainerId ||
      !sale.country
    )
      return false;

    const isValidDate = (d: any) => !isNaN(new Date(d).getTime());

    if (
      sale.gender &&
      !allowedValues.gender.includes(String(sale.gender).toLowerCase())
    )
      return false;

    if (
      sale.trainingAt &&
      !allowedValues.trainingAt.includes(String(sale.trainingAt).toLowerCase())
    )
      return false;

    if (
      sale.memberType &&
      !allowedValues.memberType.includes(String(sale.memberType).toLowerCase())
    )
      return false;

    if (
      sale.sourceOfLead &&
      !allowedValues.sourceOfLead.includes(
        String(sale.sourceOfLead).toLowerCase(),
      )
    )
      return false;

    if (sale.membershipDetails) {
      const md = sale.membershipDetails;

      // Validate membershipType as array of {label, value}
      if (
        md.membershipType &&
        Array.isArray(md.membershipType) &&
        md.membershipType.some(
          (type: any) =>
            !allowedValues.membershipType.includes(
              String(type.value).toLowerCase(),
            ),
        )
      ) {
        return false;
      }

      if (
        !md.purchaseDate ||
        !md.discountedPrice ||
        !md.startDate ||
        !md.expiryDate ||
        isNaN(md.discountedPrice) ||
        isNaN(md.actualPrice) ||
        !isValidDate(md.purchaseDate) ||
        !isValidDate(md.startDate) ||
        !isValidDate(md.expiryDate)
      ) {
        console.log('Invalid membership details:');
        return false;
      }
    }

    return true;
  }
}
