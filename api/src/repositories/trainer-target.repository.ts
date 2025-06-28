import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {TrainerTarget, TrainerTargetRelations, DepartmentTarget, Trainer, Kpi} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DepartmentTargetRepository} from './department-target.repository';
import {TrainerRepository} from './trainer.repository';
import {KpiRepository} from './kpi.repository';

export class TrainerTargetRepository extends TimeStampRepositoryMixin<
  TrainerTarget,
  typeof TrainerTarget.prototype.id,
  Constructor<
    DefaultCrudRepository<
      TrainerTarget,
      typeof TrainerTarget.prototype.id,
      TrainerTargetRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly departmentTarget: BelongsToAccessor<DepartmentTarget, typeof TrainerTarget.prototype.id>;

  public readonly trainer: BelongsToAccessor<Trainer, typeof TrainerTarget.prototype.id>;

  public readonly kpi: BelongsToAccessor<Kpi, typeof TrainerTarget.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('DepartmentTargetRepository') protected departmentTargetRepositoryGetter: Getter<DepartmentTargetRepository>, @repository.getter('TrainerRepository') protected trainerRepositoryGetter: Getter<TrainerRepository>, @repository.getter('KpiRepository') protected kpiRepositoryGetter: Getter<KpiRepository>,
  ) {
    super(TrainerTarget, dataSource);
    this.kpi = this.createBelongsToAccessorFor('kpi', kpiRepositoryGetter,);
    this.registerInclusionResolver('kpi', this.kpi.inclusionResolver);
    this.trainer = this.createBelongsToAccessorFor('trainer', trainerRepositoryGetter,);
    this.registerInclusionResolver('trainer', this.trainer.inclusionResolver);
    this.departmentTarget = this.createBelongsToAccessorFor('departmentTarget', departmentTargetRepositoryGetter,);
    this.registerInclusionResolver('departmentTarget', this.departmentTarget.inclusionResolver);
  }
}
