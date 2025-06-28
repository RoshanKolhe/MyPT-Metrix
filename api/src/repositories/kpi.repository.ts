import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Kpi, KpiRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class KpiRepository extends TimeStampRepositoryMixin<
  Kpi,
  typeof Kpi.prototype.id,
  Constructor<DefaultCrudRepository<Kpi, typeof Kpi.prototype.id, KpiRelations>>
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(Kpi, dataSource);
  }
}
