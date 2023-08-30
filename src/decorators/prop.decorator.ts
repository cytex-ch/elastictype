import {FieldOptions} from '../types';

function Field(options: FieldOptions): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    TypeMetadataStorage.addProperty({
      target: target.constructor,
      propertyKey: propertyKey,
      options: options,
    });
  };
}

export {Field as Prop};
