import { TypeMetadataStorage } from "./storage/type-metadata.storage";

export * from "./decorators/hook.decorator";
export * from "./decorators/inject-index.decorator";
export * from "./decorators/prop.decorator";
export * from "./decorators/schema.decorator";
export * from "./elastictype-core-module";
export * from "./elastictype.module";
export * from "./metadata/property-metadata";
export * from "./metadata/schema.metadata";
export * from "./providers/index.service";
export * from "./storage/type-metadata.storage";
export * from "./types";

export interface BaseSchemaInterface<T = any> {
  save(): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(): Promise<T>;
}

export abstract class BaseSchema<T> implements BaseSchemaInterface<T> {
  id!: string;

  constructor(data?: any) {
    if (data) {
      Object.keys(data).forEach((key) => {
        (this as any)[key] = data[key];
      });
    }
  }

  static async findOne<T>(id: string): Promise<T & BaseSchemaInterface> {
    return TypeMetadataStorage.findOne(this, id);
  }

  static async updateByQuery<T>(
    query: any,
    data: any
  ): Promise<(T & BaseSchemaInterface)[]> {
    return TypeMetadataStorage.updateByQuery(this, query, data);
  }

  static async count(): Promise<number> {
    return TypeMetadataStorage.count(this);
  }

  static async exists(id: string): Promise<boolean> {
    return TypeMetadataStorage.exists(this, id) as any;
  }

  static async sql(sql: string): Promise<any> {
    return TypeMetadataStorage.sql(this, sql) as any;
  }

  static async findAll<T>(): Promise<(T & BaseSchemaInterface)[]> {
    return TypeMetadataStorage.findAll(this) as any;
  }

  static async findByQuery<T>(
    query: any,
    size?: number,
    from?: number
  ): Promise<(T & BaseSchemaInterface)[]> {
    return TypeMetadataStorage.findByQuery(this, query, size, from) as any;
  }

  async save(): Promise<T> {
    return TypeMetadataStorage.save(this.constructor, {
      ...this,
    }).then((res: any) => {
      this.id = res._id;

      for (const property of TypeMetadataStorage.getPropertiesForTarget(
        this.constructor
      )) {
        this[property.propertyKey as keyof this] =
          res?.[property.propertyKey] ??
          this[property.propertyKey as keyof this];
      }

      return this as unknown as T;
    });
  }

  async update(data: any): Promise<T> {
    return TypeMetadataStorage.update(this.constructor, this.id, {
      ...this,
      ...data,
    }).then(() => {
      Object.keys(data).forEach((key) => {
        (this as any)[key] = data[key];
      });
      return this as any;
    });
  }

  async delete() {
    return TypeMetadataStorage.delete(this.constructor, this.id) as any;
  }
}
