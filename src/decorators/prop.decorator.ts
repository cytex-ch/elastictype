import { PropOptions } from "../metadata/property-metadata";
import { TypeMetadataStorage } from "../storage/type-metadata.storage";

const TYPE_METADATA_KEY = "design:type";

/**
 * @Prop decorator is used to mark a specific class property as a Elastictype property.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function Prop(options?: PropOptions) {
  return (target: any, propertyKey: any) => {
    if (typeof options === "string") {
      options = { type: options };
    }

    TypeMetadataStorage.addProperty({
      target: target.constructor,
      propertyKey: propertyKey as string,
      options: options as PropOptions,
    });
  };
}
