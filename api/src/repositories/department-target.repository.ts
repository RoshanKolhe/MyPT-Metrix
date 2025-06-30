import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {
  BranchRelations,
  DepartmentTarget,
  DepartmentTargetRelations, Department, Target, TrainerTarget, Kpi} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DepartmentRepository} from './department.repository';
import {TargetRepository} from './target.repository';
import {TrainerTargetRepository} from './trainer-target.repository';
import {KpiRepository} from './kpi.repository';

export class DepartmentTargetRepository extends TimeStampRepositoryMixin<
  DepartmentTarget,
  typeof DepartmentTarget.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DepartmentTarget,
      typeof DepartmentTarget.prototype.id,
      BranchRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly department: BelongsToAccessor<Department, typeof DepartmentTarget.prototype.id>;

  public readonly target: BelongsToAccessor<Target, typeof DepartmentTarget.prototype.id>;

  public readonly trainerTargets: HasManyRepositoryFactory<TrainerTarget, typeof DepartmentTarget.prototype.id>;

  public readonly kpi: BelongsToAccessor<Kpi, typeof DepartmentTarget.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>, @repository.getter('TargetRepository') protected targetRepositoryGetter: Getter<TargetRepository>, @repository.getter('TrainerTargetRepository') protected trainerTargetRepositoryGetter: Getter<TrainerTargetRepository>, @repository.getter('KpiRepository') protected kpiRepositoryGetter: Getter<KpiRepository>,
  ) {
    super(DepartmentTarget, dataSource);
    this.kpi = this.createBelongsToAccessorFor('kpi', kpiRepositoryGetter,);
    this.registerInclusionResolver('kpi', this.kpi.inclusionResolver);
    this.trainerTargets = this.createHasManyRepositoryFactoryFor('trainerTargets', trainerTargetRepositoryGetter,);
    this.registerInclusionResolver('trainerTargets', this.trainerTargets.inclusionResolver);
    this.target = this.createBelongsToAccessorFor('target', targetRepositoryGetter,);
    this.registerInclusionResolver('target', this.target.inclusionResolver);
    this.department = this.createBelongsToAccessorFor('department', departmentRepositoryGetter,);
    this.registerInclusionResolver('department', this.department.inclusionResolver);
  }
}
