import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Payment, PaymentRelations, Sales} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {SalesRepository} from './sales.repository';

export class PaymentRepository extends TimeStampRepositoryMixin<
  Payment,
  typeof Payment.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Payment,
      typeof Payment.prototype.id,
      PaymentRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly sales: BelongsToAccessor<Sales, typeof Payment.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('SalesRepository') protected salesRepositoryGetter: Getter<SalesRepository>,
  ) {
    super(Payment, dataSource);
    this.sales = this.createBelongsToAccessorFor('sales', salesRepositoryGetter,);
    this.registerInclusionResolver('sales', this.sales.inclusionResolver);
  }
}
