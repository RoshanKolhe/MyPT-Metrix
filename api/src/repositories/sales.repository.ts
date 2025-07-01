import {Constructor, inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  HasOneRepositoryFactory,
} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Sales, SalesRelations, MembershipDetails} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {MembershipDetailsRepository} from './membership-details.repository';

export class SalesRepository extends TimeStampRepositoryMixin<
  Sales,
  typeof Sales.prototype.id,
  Constructor<
    DefaultCrudRepository<Sales, typeof Sales.prototype.id, SalesRelations>
  >
>(DefaultCrudRepository) {
  public readonly membershipDetails: HasOneRepositoryFactory<
    MembershipDetails,
    typeof Sales.prototype.id
  >;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
    @repository.getter('MembershipDetailsRepository')
    protected membershipDetailsRepositoryGetter: Getter<MembershipDetailsRepository>,
  ) {
    super(Sales, dataSource);
    this.membershipDetails = this.createHasOneRepositoryFactoryFor(
      'membershipDetails',
      membershipDetailsRepositoryGetter,
    );
    this.registerInclusionResolver(
      'membershipDetails',
      this.membershipDetails.inclusionResolver,
    );
  }
}
