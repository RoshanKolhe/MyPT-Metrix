import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MyptMetrixDataSource} from '../datasources';
import {
  BranchRelations,
  DepartmentTarget,
  DepartmentTargetRelations, Department} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DepartmentRepository} from './department.repository';

export class DepartmentTargetRepository extends TimeStampRepositoryMixin<
  DepartmentTarget,
  typeof DepartmentTarget.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DepartmentTarget,
      typeof DepartmentTarget.prototype.id,
      BranchRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly department: BelongsToAccessor<Department, typeof DepartmentTarget.prototype.id>;

  constructor(
    @inject('datasources.myptMetrix') dataSource: MyptMetrixDataSource, @repository.getter('DepartmentRepository') protected departmentRepositoryGetter: Getter<DepartmentRepository>,
  ) {
    super(DepartmentTarget, dataSource);
    this.department = this.createBelongsToAccessorFor('department', departmentRepositoryGetter,);
    this.registerInclusionResolver('department', this.department.inclusionResolver);
  }
}
