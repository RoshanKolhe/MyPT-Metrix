import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {Branch, BranchRelations, Department, BranchDepartment} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {BranchDepartmentRepository} from './branch-department.repository';
import {DepartmentRepository} from './department.repository';

export class BranchRepository extends TimeStampRepositoryMixin<
  Branch,
  typeof Branch.prototype.id,
  Constructor<
    DefaultCrudRepository<Branch, typeof Branch.prototype.id, BranchRelations>
  >
>(DefaultCrudRepository) {

  public readonly departments: HasManyThroughRepositoryFactory<Department, typeof Department.prototype.id,
          BranchDepartment,
          typeof Branch.prototype.id
        >;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('BranchDepartmentRepository') protected branchDepartmentRepositoryGetter: Getter<BranchDepartmentRepository>, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>,
  ) {
    super(Branch, dataSource);
    this.departments = this.createHasManyThroughRepositoryFactoryFor('departments', departmentRepositoryGetter, branchDepartmentRepositoryGetter,);
    this.registerInclusionResolver('departments', this.departments.inclusionResolver);
  }
}
