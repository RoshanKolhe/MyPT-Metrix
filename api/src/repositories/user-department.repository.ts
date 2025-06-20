import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {UserDepartment, UserDepartmentRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class UserDepartmentRepository extends TimeStampRepositoryMixin<
  UserDepartment,
  typeof UserDepartment.prototype.id,
  Constructor<
    DefaultCrudRepository<
      UserDepartment,
      typeof UserDepartment.prototype.id,
      UserDepartmentRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource,
  ) {
    super(UserDepartment, dataSource);
  }
}
