import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Notification} from '../models';
import {NotificationRepository} from '../repositories';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {PermissionKeys} from '../authorization/permission-keys';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class NotificationController {
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
  ) {}

  @authenticate({
    strategy: 'jwt',
  })
  @post('/notifications')
  @response(200, {
    description: 'Notification model instance',
    content: {'application/json': {schema: getModelSchemaRef(Notification)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Notification, {
            title: 'NewNotification',
            exclude: ['id'],
          }),
        },
      },
    })
    notification: Omit<Notification, 'id'>,
  ): Promise<Notification> {
    return this.notificationRepository.create(notification);
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/notifications')
  @response(200, {
    description: 'Array of Notification model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Notification, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.filter(Notification) filter?: Filter<Notification>,
  ): Promise<Notification[]> {
    const currentUserPermission = currentUser.permissions;
    if (
      currentUserPermission.includes('super_admin') ||
      currentUserPermission.includes('admin')
    ) {
      return this.notificationRepository.find({...filter, where: {userId: 0}});
    } else {
      return this.notificationRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          userId: currentUser.id,
        },
      });
    }
  }

  @authenticate({
    strategy: 'jwt',
  })
  @get('/notifications/{id}')
  @response(200, {
    description: 'Notification model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Notification, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Notification, {exclude: 'where'})
    filter?: FilterExcludingWhere<Notification>,
  ): Promise<Notification> {
    return this.notificationRepository.findById(id, filter);
  }

  @authenticate({
    strategy: 'jwt',
  })
  @patch('/notifications/{id}')
  @response(204, {
    description: 'Notification PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Notification, {partial: true}),
        },
      },
    })
    notification: Notification,
  ): Promise<void> {
    await this.notificationRepository.updateById(id, notification);
  }

  @authenticate({
    strategy: 'jwt',
  })
  @patch('/notifications/markAllAsRead')
  @response(200, {
    description: 'Notification PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async markAllAsRead(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Notification, {partial: true}),
        },
      },
    })
    notification: Notification,
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.where(Notification) where?: Where<Notification>,
  ): Promise<Count> {
    const currentUserPermission = currentUser.permissions;
    if (
      currentUserPermission.includes('super_admin') ||
      currentUserPermission.includes('admin')
    ) {
      return this.notificationRepository.updateAll(
        {status: 1},
        {
          ...where,
          userId: 0,
        },
      );
    } else {
      return this.notificationRepository.updateAll(
        {status: 1},
        {
          ...where,
          userId: currentUser.id,
        },
      );
    }
  }

  @authenticate({
    strategy: 'jwt',
  })
  @del('/notifications/{id}')
  @response(204, {
    description: 'Notification DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.notificationRepository.deleteById(id);
  }
}
