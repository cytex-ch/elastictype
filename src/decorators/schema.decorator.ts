import { TypeMetadataStorage } from "../storage/type-metadata.storage";

/**
 * Interface defining schema options that can be passed to `@Schema()` decorator.
 */
export type SchemaOptions = { index: string } | string;

/**
 * @Schema decorator is used to mark a class as a Elastictype schema.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function Schema(options?: SchemaOptions): ClassDecorator {
  return (target: any) => {
    TypeMetadataStorage.addSchema({
      target,
      options: options as any,
    });
  };
}
