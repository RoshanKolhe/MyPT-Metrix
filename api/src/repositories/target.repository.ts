import { Constructor, inject, Getter} from '@loopback/core';
import { DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import { MyptMetrixDataSource } from '../datasources';
import { Target, TargetRelations, Branch, Department, Trainer, User, DepartmentTarget} from '../models';
import { TimeStampRepositoryMixin } from '../mixins/timestamp-repository-mixin';
import {BranchRepository} from './branch.repository';
import {DepartmentRepository} from './department.repository';
import {TrainerRepository} from './trainer.repository';
import {UserRepository} from './user.repository';
import {DepartmentTargetRepository} from './department-target.repository';

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

  public readonly assignedByUser: BelongsToAccessor<User, typeof Target.prototype.id>;

  public readonly cgmApproverUser: BelongsToAccessor<User, typeof Target.prototype.id>;

  public readonly departmentTargets: HasManyRepositoryFactory<DepartmentTarget, typeof Target.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>, @repository.getter('TrainerRepository') protected trainerRepositoryGetter: Getter<TrainerRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('DepartmentTargetRepository') protected departmentTargetRepositoryGetter: Getter<DepartmentTargetRepository>,
  ) {
    super(Target, dataSource);
    this.departmentTargets = this.createHasManyRepositoryFactoryFor('departmentTargets', departmentTargetRepositoryGetter,);
    this.registerInclusionResolver('departmentTargets', this.departmentTargets.inclusionResolver);
    this.cgmApproverUser = this.createBelongsToAccessorFor('cgmApproverUser', userRepositoryGetter,);
    this.registerInclusionResolver('cgmApproverUser', this.cgmApproverUser.inclusionResolver);
    this.assignedByUser = this.createBelongsToAccessorFor('assignedByUser', userRepositoryGetter,);
    this.registerInclusionResolver('assignedByUser', this.assignedByUser.inclusionResolver);

    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
  }
}
