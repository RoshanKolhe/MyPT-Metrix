import {Constructor, inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  HasManyThroughRepositoryFactory,
} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {
  Trainer,
  TrainerRelations,
  User,
  Branch,
  Department,
  DepartmentTrainer,
} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {UserRepository} from './user.repository';
import {BranchRepository} from './branch.repository';
import {DepartmentRepository} from './department.repository';
import {DepartmentTrainerRepository} from './department-trainer.repository';

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
  public readonly supervisor: BelongsToAccessor<
    User,
    typeof Trainer.prototype.id
  >;

  public readonly branch: BelongsToAccessor<
    Branch,
    typeof Trainer.prototype.id
  >;

  public readonly departments: HasManyThroughRepositoryFactory<
    Department,
    typeof Department.prototype.id,
    DepartmentTrainer,
    typeof Trainer.prototype.id
  >;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('BranchRepository')
    protected branchRepositoryGetter: Getter<BranchRepository>,
    @repository.getter('DepartmentRepository')
    protected departmentRepositoryGetter: Getter<DepartmentRepository>,
    @repository.getter('DepartmentTrainerRepository')
    protected departmentTrainerRepositoryGetter: Getter<DepartmentTrainerRepository>,
  ) {
    super(Trainer, dataSource);
    this.departments = this.createHasManyThroughRepositoryFactoryFor(
      'departments',
      departmentRepositoryGetter,
      departmentTrainerRepositoryGetter,
    );
    this.registerInclusionResolver(
      'departments',
      this.departments.inclusionResolver,
    );
    this.branch = this.createBelongsToAccessorFor(
      'branch',
      branchRepositoryGetter,
    );
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.supervisor = this.createBelongsToAccessorFor(
      'supervisor',
      userRepositoryGetter,
    );
    this.registerInclusionResolver(
      'supervisor',
      this.supervisor.inclusionResolver,
    );
  }
}
