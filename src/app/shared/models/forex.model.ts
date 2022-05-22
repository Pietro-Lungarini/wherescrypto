import { ForexSignal } from './forexSignal.model';

export interface ForexRequest {
	id: string;
	signal: ForexSignal;
}