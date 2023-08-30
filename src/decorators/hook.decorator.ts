function Hook(
  name:
    | 'preSave'
    | 'postSave'
    | 'preUpdate'
    | 'postUpdate'
    | 'preDelete'
    | 'postDelete'
): MethodDecorator {
  return (
    target: Object,
    propertyKey: PropertyKey,
    descriptor: PropertyDescriptor
  ) => {
    TypeMetadataStorage.addHook({
      target: target.constructor,
      name: name,
      originalName: propertyKey,
      value: descriptor?.value,
    });
  };
}

export {Hook};
