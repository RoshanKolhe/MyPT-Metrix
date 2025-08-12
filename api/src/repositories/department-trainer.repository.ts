import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {DepartmentTrainer, DepartmentTrainerRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class DepartmentTrainerRepository extends TimeStampRepositoryMixin<
  DepartmentTrainer,
  typeof DepartmentTrainer.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DepartmentTrainer,
      typeof DepartmentTrainer.prototype.id,
      DepartmentTrainerRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(DepartmentTrainer, dataSource);
  }
}
