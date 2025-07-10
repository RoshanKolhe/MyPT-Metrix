import {Constructor, inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  HasOneRepositoryFactory,
  BelongsToAccessor,
} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {
  Sales,
  SalesRelations,
  MembershipDetails,
  Trainer,
  Branch,
  Department, User} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {MembershipDetailsRepository} from './membership-details.repository';
import {TrainerRepository} from './trainer.repository';
import {BranchRepository} from './branch.repository';
import {DepartmentRepository} from './department.repository';
import {UserRepository} from './user.repository';

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

  public readonly trainer: BelongsToAccessor<
    Trainer,
    typeof Sales.prototype.id
  >;

  public readonly salesTrainer: BelongsToAccessor<
    Trainer,
    typeof Sales.prototype.id
  >;

  public readonly branch: BelongsToAccessor<Branch, typeof Sales.prototype.id>;

  public readonly department: BelongsToAccessor<
    Department,
    typeof Sales.prototype.id
  >;

  public readonly deletedByUser: BelongsToAccessor<User, typeof Sales.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
    @repository.getter('MembershipDetailsRepository')
    protected membershipDetailsRepositoryGetter: Getter<MembershipDetailsRepository>,
    @repository.getter('TrainerRepository')
    protected trainerRepositoryGetter: Getter<TrainerRepository>,
    @repository.getter('BranchRepository')
    protected branchRepositoryGetter: Getter<BranchRepository>,
    @repository.getter('DepartmentRepository')
    protected departmentRepositoryGetter: Getter<DepartmentRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Sales, dataSource);
    this.deletedByUser = this.createBelongsToAccessorFor('deletedByUser', userRepositoryGetter,);
    this.registerInclusionResolver('deletedByUser', this.deletedByUser.inclusionResolver);
    this.department = this.createBelongsToAccessorFor(
      'department',
      departmentRepositoryGetter,
    );
    this.registerInclusionResolver(
      'department',
      this.department.inclusionResolver,
    );
    this.branch = this.createBelongsToAccessorFor(
      'branch',
      branchRepositoryGetter,
    );
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.salesTrainer = this.createBelongsToAccessorFor(
      'salesTrainer',
      trainerRepositoryGetter,
    );
    this.registerInclusionResolver(
      'salesTrainer',
      this.salesTrainer.inclusionResolver,
    );
    this.trainer = this.createBelongsToAccessorFor(
      'trainer',
      trainerRepositoryGetter,
    );
    this.registerInclusionResolver('trainer', this.trainer.inclusionResolver);
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
