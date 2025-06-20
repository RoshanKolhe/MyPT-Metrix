import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {User, UserRelations, Branch, Department, UserDepartment} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {BranchRepository} from './branch.repository';
import {UserDepartmentRepository} from './user-department.repository';
import {DepartmentRepository} from './department.repository';

export type Credentials = {
  email?: string;
  password: string;
};

export class UserRepository extends TimeStampRepositoryMixin<
  User,
  typeof User.prototype.id,
  Constructor<
    DefaultCrudRepository<User, typeof User.prototype.id, UserRelations>
  >
>(DefaultCrudRepository) {

  public readonly branch: BelongsToAccessor<Branch, typeof User.prototype.id>;

  public readonly departments: HasManyThroughRepositoryFactory<Department, typeof Department.prototype.id,
          UserDepartment,
          typeof User.prototype.id
        >;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('UserDepartmentRepository') protected userDepartmentRepositoryGetter: Getter<UserDepartmentRepository>, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>,
  ) {
    super(User, dataSource);
    this.departments = this.createHasManyThroughRepositoryFactoryFor('departments', departmentRepositoryGetter, userDepartmentRepositoryGetter,);
    this.registerInclusionResolver('departments', this.departments.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
  }
}
