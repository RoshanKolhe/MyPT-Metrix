import {Credentials} from './../repositories/user.repository';
import * as isEmail from 'isemail';
import {HttpErrors} from '@loopback/rest';

export function validateCredentials(credentials: Credentials) {
  if (!credentials.email) {
    throw new HttpErrors.UnprocessableEntity('Email is mandatory');
  }
  if (credentials.email && !isEmail.validate(credentials.email)) {
    throw new HttpErrors.UnprocessableEntity('invalid email');
  }

  if (credentials.password.length < 6) {
    throw new HttpErrors.UnprocessableEntity(
      'password length should be greater than 8',
    );
  }
}

export function validateCredentialsForPhoneLogin(phoneNumber: any) {
  console.log(phoneNumber);
  const phoneRegex = /^\+(?:[0-9] ?){6,14}[0-9]$/;

  // Test the phone number against the regular expression pattern
  if (!phoneRegex.test(phoneNumber)) {
    throw new HttpErrors.UnprocessableEntity('Invalid phone number');
  }
}
