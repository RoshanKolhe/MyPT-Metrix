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
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(DepartmentKpi, dataSource);
  }
}
