import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  DepartmentTarget,
  Kpi,
} from '../models';
import {DepartmentTargetRepository} from '../repositories';

export class DepartmentTargetKpiController {
  constructor(
    @repository(DepartmentTargetRepository)
    public departmentTargetRepository: DepartmentTargetRepository,
  ) { }

  @get('/department-targets/{id}/kpi', {
    responses: {
      '200': {
        description: 'Kpi belonging to DepartmentTarget',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Kpi),
          },
        },
      },
    },
  })
  async getKpi(
    @param.path.number('id') id: typeof DepartmentTarget.prototype.id,
  ): Promise<Kpi> {
    return this.departmentTargetRepository.kpi(id);
  }
}
