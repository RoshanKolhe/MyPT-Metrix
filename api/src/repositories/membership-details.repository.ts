import {Constructor, inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {MembershipDetails, MembershipDetailsRelations, Sales} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {SalesRepository} from './sales.repository';

export class MembershipDetailsRepository extends TimeStampRepositoryMixin<
  MembershipDetails,
  typeof MembershipDetails.prototype.id,
  Constructor<
    DefaultCrudRepository<
      MembershipDetails,
      typeof MembershipDetails.prototype.id,
      MembershipDetailsRelations
    >
  >
>(DefaultCrudRepository) {
  public readonly sales: BelongsToAccessor<
    Sales,
    typeof MembershipDetails.prototype.id
  >;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
    @repository.getter('SalesRepository')
    protected salesRepositoryGetter: Getter<SalesRepository>,
  ) {
    super(MembershipDetails, dataSource);
    this.sales = this.createBelongsToAccessorFor(
      'sales',
      salesRepositoryGetter,
    );
    this.registerInclusionResolver('sales', this.sales.inclusionResolver);
  }
}
