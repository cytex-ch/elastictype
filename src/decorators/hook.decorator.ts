import { TypeMetadataStorage } from "../storage/type-metadata.storage";

export const Hook =
  (
    name:
      | "preSave"
      | "postSave"
      | "preUpdate"
      | "postUpdate"
      | "preDelete"
      | "postDelete"
  ) =>
  (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    TypeMetadataStorage.addHook({
      target: target.constructor,
      name: name,
      value: descriptor.value,
    });
  };
