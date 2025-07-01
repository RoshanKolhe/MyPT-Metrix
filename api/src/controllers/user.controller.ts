/* eslint-disable @typescript-eslint/naming-convention */
import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  DefaultTransactionalRepository,
  Filter,
  IsolationLevel,
  Where,
  WhereBuilder,
  repository,
} from '@loopback/repository';
import {
  HttpErrors,
  del,
  get,
  getJsonSchemaRef,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import * as _ from 'lodash';
import {PermissionKeys} from '../authorization/permission-keys';
import {EmailManagerBindings} from '../keys';
import {User} from '../models';
import {
  Credentials,
  UserDepartmentRepository,
  UserRepository,
} from '../repositories';
import {EmailManager, EmailService} from '../services/email.service';
import {BcryptHasher} from '../services/hash.password.bcrypt';
import {JWTService} from '../services/jwt-service';
import {MyUserService} from '../services/user-service';
import {validateCredentials} from '../services/validator';
import generateOtpTemplate from '../templates/otp.template';
import SITE_SETTINGS from '../utils/config';
import {CredentialsRequestBody} from './specs/user-controller-spec';
import {MyptMetrixDataSource} from '../datasources';
import generateResetPasswordTemplate from '../templates/reset-password.template';
import {SendGridEmailService} from '../services/sendgrid-email.service';

export class UserController {
  constructor(
    @inject('datasources.myptMetrix')
    public dataSource: MyptMetrixDataSource,
    @inject(EmailManagerBindings.SEND_MAIL)
    public emailManager: EmailManager,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserDepartmentRepository)
    public userDepartmentRepository: UserDepartmentRepository,
    @inject('service.hasher')
    public hasher: BcryptHasher,
    @inject('service.user.service')
    public userService: MyUserService,
    @inject('service.jwt.service')
    public jwtService: JWTService,
    @inject('services.SendGridEmailService')
    private sendGridEmailService: SendGridEmailService,
  ) {}

  @post('/register', {
    responses: {
      '200': {
        description: 'User',
        content: {
          schema: getJsonSchemaRef(User),
        },
      },
    },
  })
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(User, {
                exclude: ['id'],
              }).definitions?.User?.properties,
              departments: {
                type: 'array',
                items: {type: 'number'},
              },
            },
            required: ['email', 'password', 'permissions'], // no branchId here
          },
        },
      },
    })
    userData: Omit<User, 'id'> & {departments?: number[]},
  ): Promise<any> {
    const repo = new DefaultTransactionalRepository(User, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const rolesRequiringBranch = ['hod', 'sub_hod'];

      const role = userData.permissions?.[0]; // assuming single-role system

      if (rolesRequiringBranch.includes(role) && !userData.branchId) {
        throw new HttpErrors.BadRequest(
          'branchId is required for role: ' + role,
        );
      }

      validateCredentials(userData);

      const existing = await this.userRepository.findOne({
        where: {email: userData.email},
      });

      if (existing) {
        throw new HttpErrors.BadRequest('User Already Exists');
      }

      const departments = userData.departments ?? [];

      delete (userData as any).departments;
      // 🔐 Hash password
      userData.password = await this.hasher.hashPassword(userData.password);

      // 🧑 Create user
      const savedUser = await this.userRepository.create(userData, {
        transaction: tx,
      });

      // 🔗 Link to departments (if any)
      for (const deptId of departments) {
        await this.userDepartmentRepository.create(
          {
            userId: savedUser.id,
            departmentId: deptId,
          },
          {transaction: tx},
        );
      }

      await tx.commit();

      return {
        success: true,
        userData: _.omit(savedUser, 'password'),
        message: 'User registered successfully',
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  @post('/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{}> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);
    const userData = _.omit(user, 'password');
    const token = await this.jwtService.generateToken(userProfile);
    const allUserData = await this.userRepository.findById(userData.id, {
      include: ['branch', 'departments'],
    });
    return Promise.resolve({
      accessToken: token,
      user: allUserData,
    });
  }

  @get('/me')
  @authenticate('jwt')
  async whoAmI(
    @inject(AuthenticationBindings.CURRENT_USER) currnetUser: UserProfile,
  ): Promise<{}> {
    console.log(currnetUser);
    const user = await this.userRepository.findOne({
      where: {
        id: currnetUser.id,
      },
      include: ['branch', 'departments'],
    });
    const userData = _.omit(user, 'password');
    return Promise.resolve({
      ...userData,
      displayName: `${userData?.firstName} ${userData?.lastName}`,
    });
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
      ],
    },
  })
  @get('/users/list')
  @response(200, {
    description: 'Array of Users model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {
            includeRelations: true,
          }),
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    const loggedInUser = await this.userRepository.findById(currentUser.id, {
      include: ['departments'],
    });

    const permissions = currentUser.permissions || [];

    // Base filter to exclude self and soft-deleted users
    const baseWhere: Where<User> = {
      id: {neq: currentUser.id},
      isDeleted: false,
    };

    const baseFields = {
      password: false,
      otp: false,
      otpExpireAt: false,
    };

    // ✅ SUPER_ADMIN or ADMIN: return all users except self
    if (
      permissions.includes(PermissionKeys.SUPER_ADMIN) ||
      permissions.includes(PermissionKeys.ADMIN)
    ) {
      return this.userRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          ...baseWhere,
        },
        fields: baseFields,
      });
    }

    // ✅ CGM: return users from same branch
    if (permissions.includes(PermissionKeys.CGM)) {
      return this.userRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          ...baseWhere,
          branchId: loggedInUser.branchId,
        },
        fields: baseFields,
      });
    }

    // ✅ HOD: return sub_hod users in same branch AND matching departments
    if (permissions.includes(PermissionKeys.HOD)) {
      const departmentIds = loggedInUser.departments?.map(d => d.id) ?? [];

      if (departmentIds.length === 0) {
        return []; // No departments assigned → return nothing
      }

      // Fetch all users in same branch
      const allUsersInBranch = await this.userRepository.find({
        where: {
          id: {neq: currentUser.id},
          isDeleted: false,
          branchId: loggedInUser.branchId,
        },
        fields: baseFields,
        include: ['departments'],
      });

      // Filter: permissions must include 'sub_hod' AND share at least one department
      const finalUsers = allUsersInBranch.filter(
        user =>
          user.permissions?.includes('sub_hod') &&
          user.departments?.some(dep => departmentIds.includes(dep.id)),
      );

      return finalUsers;
    }

    // Default fallback: deny access
    return [];
  }

  @authenticate({
    strategy: 'jwt',
    options: {
      required: [
        PermissionKeys.SUPER_ADMIN,
        PermissionKeys.ADMIN,
        PermissionKeys.CGM,
        PermissionKeys.HOD,
      ],
    },
  })
  @get('/users/{id}', {
    responses: {
      '200': {
        description: 'User Details',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getSingleUser(@param.path.number('id') id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
      fields: {
        password: false,
        otp: false,
        otpExpireAt: false,
      },
      include: [
        {relation: 'departments'},
        {
          relation: 'branch',
          scope: {
            include: ['departments'],
          },
        },
      ],
    });
    return Promise.resolve({
      ...user,
    });
  }

  @authenticate({
    strategy: 'jwt',
  })
  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(User, {partial: true}).definitions?.User
                ?.properties,
              departments: {
                type: 'array',
                items: {type: 'number'},
              },
            },
          },
        },
      },
    })
    user: Partial<User> & {departments?: number[]},
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
  ): Promise<any> {
    // Begin transaction
    const repo = new DefaultTransactionalRepository(User, this.dataSource);
    const tx = await repo.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new HttpErrors.NotFound('User not found');
      }

      // Hash password if it's being updated
      if (user.password) {
        user.password = await this.hasher.hashPassword(user.password);
      }

      // Validate email uniqueness only if changed
      if (user.email && user.email !== existingUser.email) {
        const emailExists = await this.userRepository.findOne({
          where: {email: user.email, id: {neq: id}},
        });
        if (emailExists) {
          throw new HttpErrors.BadRequest('Email already exists');
        }
      }

      const departments = user.departments ?? [];
      if ('departments' in user) {
        delete (user as any).departments;
      }
      console.log('departments', departments);
      await this.userRepository.updateById(id, user, {transaction: tx});
      if (departments && departments.length) {
        await this.userDepartmentRepository.deleteAll(
          {userId: id},
          {transaction: tx},
        );

        for (const deptId of departments) {
          await this.userDepartmentRepository.create(
            {
              userId: id,
              departmentId: deptId,
            },
            {transaction: tx},
          );
        }
      }

      await tx.commit();

      return {
        success: true,
        message: `User profile updated successfully`,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  @post('/sendResetPasswordLink')
  async sendResetPasswordLink(
    @requestBody({
      description: 'Input for sending reset password link',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'The email address of the user',
              },
            },
            required: ['email'],
          },
        },
      },
    })
    userData: {
      email: string;
    },
  ): Promise<object> {
    const user = await this.userRepository.findOne({
      where: {
        email: userData.email,
      },
    });
    if (user) {
      const userProfile = this.userService.convertToUserProfile(user);
      const token = await this.jwtService.generate10MinToken(userProfile);
      const resetPasswordLink = `${process.env.REACT_APP_ENDPOINT}/auth/jwt/new-password?token=${token}`;
      const template = generateResetPasswordTemplate({
        userData: userProfile,
        resetLink: resetPasswordLink,
      });
      console.log(template);
      const mailOptions = {
        to: userData.email,
        subject: template.subject,
        html: template.html,
      };

      try {
        await this.sendGridEmailService.sendMail(mailOptions);
        return {
          success: true,
          message: `Password reset link sent to ${userData.email}. Please check your inbox.`,
        };
      } catch (err) {
        console.log('sendgrid', JSON.stringify(err));
        throw new HttpErrors.UnprocessableEntity(
          err.message || 'Mail sending failed',
        );
      }
    } else {
      throw new HttpErrors.BadRequest("Email Doesn't Exist");
    }
  }

  @authenticate('jwt')
  @post('/setPassword')
  async setPassword(
    @requestBody({
      description: 'Input for changing user password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              oldPassword: {
                type: 'string',
                description: "The user's current password",
              },
              newPassword: {
                type: 'string',
                description: 'The new password to be set',
              },
            },
            required: ['oldPassword', 'newPassword'],
          },
        },
      },
    })
    passwordOptions: any,
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
  ): Promise<object> {
    const user = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (user) {
      const passwordCheck = await this.hasher.comparePassword(
        passwordOptions.oldPassword,
        user.password,
      );

      if (passwordCheck) {
        const encryptedPassword = await this.hasher.hashPassword(
          passwordOptions.newPassword,
        );
        await this.userRepository.updateById(user.id, {
          password: encryptedPassword,
        });
        return {
          success: true,
          message: 'Password changed successfully',
        };
      } else {
        throw new HttpErrors.BadRequest("Old password doesn't match");
      }
    } else {
      throw new HttpErrors.BadRequest("Email doesn't exist");
    }
  }

  @authenticate('jwt')
  @post('/setNewPassword')
  async setNewPassword(
    @requestBody({
      description: 'Input for resetting user password without the old password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'The email address of the user',
              },
              newPassword: {
                type: 'string',
                description: 'The new password to be set',
              },
            },
            required: ['email', 'newPassword'], // Only email and newPassword are required
          },
        },
      },
    })
    passwordOptions: any,
  ): Promise<object> {
    const user = await this.userRepository.findOne({
      where: {
        email: passwordOptions.email,
      },
    });

    if (user) {
      const encryptedPassword = await this.hasher.hashPassword(
        passwordOptions.newPassword,
      );
      await this.userRepository.updateById(user.id, {
        password: encryptedPassword,
      });
      return {
        success: true,
        message: 'Password updated successfully',
      };
    } else {
      throw new HttpErrors.BadRequest("Email doesn't exist");
    }
  }

  @authenticate({
    strategy: 'jwt',
    options: {required: [PermissionKeys.SUPER_ADMIN]},
  })
  @del('/user/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpErrors.BadRequest('User Not Found');
    }

    await this.userRepository.updateById(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  @authenticate('jwt')
  @post('/users/by-branch-department')
  async getUsersByBranchAndDepartment(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['branchId', 'departmentId'],
            properties: {
              branchId: {type: 'number'},
              departmentId: {type: 'number'},
            },
          },
        },
      },
    })
    body: {
      branchId: number;
      departmentId: number;
    },
  ): Promise<User[]> {
    const {branchId, departmentId} = body;

    // Fetch all users with the given branch
    const users = await this.userRepository.find({
      where: {
        branchId,
      },
      include: [
        {
          relation: 'departments',
          scope: {
            where: {id: departmentId},
          },
        },
      ],
    });

    // Now filter users whose permissions include 'hod' or 'subhod'
    const filtered = users.filter(
      user =>
        (user.permissions || []).includes('hod') ||
        (user.permissions || []).includes('sub_hod'),
    );

    // Ensure they are actually linked to the given department
    return filtered.filter(
      user => user.departments && user.departments.length > 0,
    );
  }

  @authenticate('jwt')
  @post('/cgms/by-branch', {
    responses: {
      '200': {
        description: 'CGM users by branch',
        content: {
          'application/json': {
            schema: {type: 'array', items: {type: 'object'}},
          },
        },
      },
    },
  })
  async getCgmsByBranch(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['branchId'],
            properties: {
              branchId: {type: 'number'},
            },
          },
        },
      },
    })
    body: {
      branchId: number;
    },
  ): Promise<object[]> {
    const {branchId} = body;

    const users = await this.userRepository.find({
      where: {branchId},
    });

    // Manually filter for users who have 'cgm' in permissions array
    return users.filter(
      user =>
        Array.isArray(user.permissions) && user.permissions.includes('cgm'),
    );
  }
}
