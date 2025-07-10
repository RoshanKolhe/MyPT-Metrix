import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Sales,
  Kpi,
} from '../models';
import {SalesRepository} from '../repositories';

export class SalesKpiController {
  constructor(
    @repository(SalesRepository)
    public salesRepository: SalesRepository,
  ) { }

  @get('/sales/{id}/kpi', {
    responses: {
      '200': {
        description: 'Kpi belonging to Sales',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Kpi),
          },
        },
      },
    },
  })
  async getKpi(
    @param.path.number('id') id: typeof Sales.prototype.id,
  ): Promise<Kpi> {
    return this.salesRepository.kpi(id);
  }
}
