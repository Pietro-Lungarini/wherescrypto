import { IconNamesEnum } from 'ngx-bootstrap-icons';

export interface DropdownOptions {
  url?: string;
  name?: string;
  icon?: IconNamesEnum;
  action?: boolean;
  selected?: boolean;
  value?: any;
  type?: 'group';
  childrens?: DropdownOptions[];
}
