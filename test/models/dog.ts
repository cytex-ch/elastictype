import {BaseSchema, ElasticDataType, Prop, Schema} from '../../src';

@Schema({index: 'dogs'})
export class Dog extends BaseSchema<Dog> {
  @Prop({
    type: ElasticDataType.Text,
  })
  name: string;
}
