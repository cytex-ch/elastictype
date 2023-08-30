import {ElasticDataType} from '../types';

export interface PropertyMetadata {
  target: Function;
  propertyKey: string | symbol;
  options: PropOptions;
}
export type PropOptions = {
  type: ElasticDataType;
  description?: string;
};
