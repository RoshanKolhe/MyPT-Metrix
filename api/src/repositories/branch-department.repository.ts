import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {BranchDepartment, BranchDepartmentRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class BranchDepartmentRepository extends TimeStampRepositoryMixin<
  BranchDepartment,
  typeof BranchDepartment.prototype.id,
  Constructor<
    DefaultCrudRepository<
      BranchDepartment,
      typeof BranchDepartment.prototype.id,
      BranchDepartmentRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(BranchDepartment, dataSource);
  }
}
