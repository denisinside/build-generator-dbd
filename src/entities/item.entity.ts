import { Addon } from './addon.entity';

export class Item {
  name: string;
  description: string;
  addons: Addon[];
}
