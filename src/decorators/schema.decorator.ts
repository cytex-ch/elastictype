import {SchemaOptions} from '../types';

function Schema(options: SchemaOptions): ClassDecorator {
  return (target: Function) => {
    TypeMetadataStorage.addSchema({
      target: target,
      constructorName: target.name,
      options: options,
    });
  };
}

export {Schema};
