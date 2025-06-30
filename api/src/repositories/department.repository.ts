import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Department, DepartmentRelations, Kpi, DepartmentKpi} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DepartmentKpiRepository} from './department-kpi.repository';
import {KpiRepository} from './kpi.repository';

export class DepartmentRepository extends TimeStampRepositoryMixin<
  Department,
  typeof Department.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Department,
      typeof Department.prototype.id,
      DepartmentRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly kpis: HasManyThroughRepositoryFactory<Kpi, typeof Kpi.prototype.id,
          DepartmentKpi,
          typeof Department.prototype.id
        >;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('DepartmentKpiRepository') protected departmentKpiRepositoryGetter: Getter<DepartmentKpiRepository>, @repository.getter('KpiRepository') protected kpiRepositoryGetter: Getter<KpiRepository>,
  ) {
    super(Department, dataSource);
    this.kpis = this.createHasManyThroughRepositoryFactoryFor('kpis', kpiRepositoryGetter, departmentKpiRepositoryGetter,);
    this.registerInclusionResolver('kpis', this.kpis.inclusionResolver);
  }
}
