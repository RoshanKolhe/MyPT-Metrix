import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Conduction, ConductionRelations, Trainer, Kpi, Branch, Department} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {TrainerRepository} from './trainer.repository';
import {KpiRepository} from './kpi.repository';
import {BranchRepository} from './branch.repository';
import {DepartmentRepository} from './department.repository';

export class ConductionRepository extends TimeStampRepositoryMixin<
  Conduction,
  typeof Conduction.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Conduction,
      typeof Conduction.prototype.id,
      ConductionRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly trainer: BelongsToAccessor<Trainer, typeof Conduction.prototype.id>;

  public readonly kpi: BelongsToAccessor<Kpi, typeof Conduction.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof Conduction.prototype.id>;

  public readonly department: BelongsToAccessor<Department, typeof Conduction.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('TrainerRepository') protected trainerRepositoryGetter: Getter<TrainerRepository>, @repository.getter('KpiRepository') protected kpiRepositoryGetter: Getter<KpiRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>,
  ) {
    super(Conduction, dataSource);
    this.department = this.createBelongsToAccessorFor('department', departmentRepositoryGetter,);
    this.registerInclusionResolver('department', this.department.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.kpi = this.createBelongsToAccessorFor('kpi', kpiRepositoryGetter,);
    this.registerInclusionResolver('kpi', this.kpi.inclusionResolver);
    this.trainer = this.createBelongsToAccessorFor('trainer', trainerRepositoryGetter,);
    this.registerInclusionResolver('trainer', this.trainer.inclusionResolver);
  }
}
