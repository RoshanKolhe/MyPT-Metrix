import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Notification,
  User,
} from '../models';
import {NotificationRepository} from '../repositories';

export class NotificationUserController {
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
  ) { }

  @get('/notifications/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to Notification',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number('id') id: typeof Notification.prototype.id,
  ): Promise<User> {
    return this.notificationRepository.user(id);
  }
}
