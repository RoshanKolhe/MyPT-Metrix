import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Trainer, TrainerRelations, User, Branch, Department} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {UserRepository} from './user.repository';
import {BranchRepository} from './branch.repository';
import {DepartmentRepository} from './department.repository';

export class TrainerRepository extends TimeStampRepositoryMixin<
  Trainer,
  typeof Trainer.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Trainer,
      typeof Trainer.prototype.id,
      TrainerRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly supervisor: BelongsToAccessor<User, typeof Trainer.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof Trainer.prototype.id>;

  public readonly department: BelongsToAccessor<Department, typeof Trainer.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>,
  ) {
    super(Trainer, dataSource);
    this.department = this.createBelongsToAccessorFor('department', departmentRepositoryGetter,);
    this.registerInclusionResolver('department', this.department.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.supervisor = this.createBelongsToAccessorFor('supervisor', userRepositoryGetter,);
    this.registerInclusionResolver('supervisor', this.supervisor.inclusionResolver);
  }
}
