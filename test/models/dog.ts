import { Hook } from "../../src/decorators/hook.decorator";
import { BaseSchema, ElasticDataType, Prop, Schema } from "../../src";

@Schema({ index: "dogs" })
export class Dog extends BaseSchema<Dog> {
  @Prop(ElasticDataType.Keyword)
  name!: string;
}
