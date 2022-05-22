/* eslint-disable require-jsdoc */
import { iGeniusUser } from 'functions/src/models/igenius.model';
import { Exchange } from './exchanges.model';
import { Roles } from './roles.model';
import { Timestamp } from './timestamp.model';
import { UserDetails } from './user-details.model';
import { UserPreferences } from './user-preferences.model';

export class User {
  id?: string;
  name?: string;
  email?: string;
  disabled?: boolean;
  roles?: Roles;
	details?: UserDetails;
	exchanges?: Exchange[];
	preferences?: UserPreferences;
	igeniusUser?: iGeniusUser;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
