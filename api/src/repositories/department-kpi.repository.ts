import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {
  Department,
  DepartmentKpi,
  DepartmentKpiRelations,
  DepartmentRelations,
} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class DepartmentKpiRepository extends TimeStampRepositoryMixin<
  DepartmentKpi,
  typeof DepartmentKpi.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DepartmentKpi,
      typeof DepartmentKpi.prototype.id,
      DepartmentKpiRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(DepartmentKpi, dataSource);
  }
}
