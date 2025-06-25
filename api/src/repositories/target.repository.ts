import { Constructor, inject, Getter} from '@loopback/core';
import { DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import { MyptMetrixDataSource } from '../datasources';
import { Target, TargetRelations, Branch, Department, Trainer, User} from '../models';
import { TimeStampRepositoryMixin } from '../mixins/timestamp-repository-mixin';
import {BranchRepository} from './branch.repository';
import {DepartmentRepository} from './department.repository';
import {TrainerRepository} from './trainer.repository';
import {UserRepository} from './user.repository';

export class TargetRepository extends TimeStampRepositoryMixin<
  Target,
  typeof Target.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Target,
      typeof Target.prototype.id,
      TargetRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly branch: BelongsToAccessor<Branch, typeof Target.prototype.id>;

  public readonly department: BelongsToAccessor<Department, typeof Target.prototype.id>;

  public readonly trainer: BelongsToAccessor<Trainer, typeof Target.prototype.id>;

  public readonly assignedbyUser: BelongsToAccessor<User, typeof Target.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>, @repository.getter('TrainerRepository') protected trainerRepositoryGetter: Getter<TrainerRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Target, dataSource);
    this.assignedbyUser = this.createBelongsToAccessorFor('assignedbyUser', userRepositoryGetter,);
    this.registerInclusionResolver('assignedbyUser', this.assignedbyUser.inclusionResolver);
    this.trainer = this.createBelongsToAccessorFor('trainer', trainerRepositoryGetter,);
    this.registerInclusionResolver('trainer', this.trainer.inclusionResolver);
    this.department = this.createBelongsToAccessorFor('department', departmentRepositoryGetter,);
    this.registerInclusionResolver('department', this.department.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
  }
}
