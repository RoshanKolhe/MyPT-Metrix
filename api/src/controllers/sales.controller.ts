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
import {MembershipDetails, Sales} from '../models';
import {SalesRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';

export class SalesController {
  constructor(
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
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
    const {membershipDetails, ...salesFields} = salesData;

    const createdSale = await this.salesRepository.create(salesFields);

    if (membershipDetails) {
      await this.salesRepository
        .membershipDetails(createdSale.id)
        .create(membershipDetails);
    }

    return this.salesRepository.findById(createdSale.id, {
      include: ['membershipDetails'],
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
  async find(@param.filter(Sales) filter?: Filter<Sales>): Promise<Sales[]> {
    return this.salesRepository.find(filter);
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
    return this.salesRepository.findById(id, filter);
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
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.salesRepository.deleteById(id);
  }
}
