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
import {MembershipDetails, Sales} from '../models';
import {SalesRepository, UserRepository} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';
import {MyptMetrixDataSource} from '../datasources';

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
}
