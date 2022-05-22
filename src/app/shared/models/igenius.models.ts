import { Timestamp } from 'src/app/auth/models/timestamp.model';


export interface iGeniusUser {
  id?: number;
  name?: string;
  country?: string;
  pv?: number;
  enrollVolume?: number;
  qev?: number;
  bvLeft?: number;
  bvRight?: number;
  activeLeft?: number;
  activeRight?: number;
  currentRank?: string;
  highestRank?: string;
  subscription?: string;
  monthRollingLeft?: number;
  monthRollingRight?: number;
  leftAndHolding?: number;
  rightAndHolding?: number;
  lastOrder?: Timestamp;
  lastOrderBV?: number;
  joinDate?: Timestamp;
  username?: string;
  enrollerName?: string;
	email?: string;
	isActive?: boolean;
	updatedAt?: Timestamp;
}

export interface iGeniusRequestedUsers {
	email?: string;
	uid?: string;
	pip?: string;
	date?: Date;
}

export interface iGeniusUserResponse {
  completion: number;
  completionMsg: string;
  error?: any;
	user?: iGeniusUser;
	requestEmail?: string;
	requestedUsers?: iGeniusRequestedUsers[];
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

export interface iGeniusRequest {
	id: number;
}
