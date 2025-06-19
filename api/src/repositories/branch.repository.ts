import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Branch, BranchRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class BranchRepository extends TimeStampRepositoryMixin<
  Branch,
  typeof Branch.prototype.id,
  Constructor<
    DefaultCrudRepository<Branch, typeof Branch.prototype.id, BranchRelations>
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(Branch, dataSource);
  }
}
