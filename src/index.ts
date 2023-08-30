import {SqlQueryResponse} from '@elastic/elasticsearch/lib/api/types';
import {TypeMetadataStorage} from './storage/type-metadata.storage';
import {Type} from './types';

export * from './decorators/hook.decorator';
export * from './decorators/inject-index.decorator';
export * from './decorators/prop.decorator';
export * from './decorators/schema.decorator';
export * from './elastictype-core-module';
export * from './elastictype.module';
export * from './metadata/property-metadata';
export * from './metadata/schema.metadata';
export * from './providers/index.service';
export * from './storage/type-metadata.storage';
export * from './types';

export interface BaseSchemaInterface<T> {
  save(): Promise<T>;
  update(data: Partial<T>): Promise<T>;
  delete(): Promise<T>;
}

export abstract class BaseSchema<T> implements BaseSchemaInterface<T> {
  id!: string;

  constructor(data?: any) {
    if (data) {
      Object.keys(data).forEach(key => {
        (this as any)[key] = data[key];
      });
    }
  }

  static async findOne<T extends BaseSchema<T>>(id: string) {
    return TypeMetadataStorage.findOne<T>(this.name, id);
  }

  static async updateByQuery<T extends BaseSchema<T>>(query: any, data: any) {
    return TypeMetadataStorage.updateByQuery<T>(this.name, query, data);
  }

  static async count(): Promise<number> {
    return TypeMetadataStorage.count(this);
  }

  static async exists(id: string): Promise<boolean> {
    return TypeMetadataStorage.exists(this, id);
  }

  static async sql(sql: string): Promise<SqlQueryResponse> {
    return TypeMetadataStorage.sql(this, sql);
  }

  static async findAll<T extends BaseSchema<T>>(): Promise<T[]> {
    return TypeMetadataStorage.findAll<T>(this.name);
  }

  static async findByQuery<T extends BaseSchema<T>>(
    query: Object,
    size?: number,
    from?: number
  ) {
    return TypeMetadataStorage.findByQuery<T>(this.name, query, size, from);
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

  async update(data: Partial<T>): Promise<T> {
    return TypeMetadataStorage.update(this.constructor, this.id, {
      ...this,
      ...data,
    }).then(() => {
      Object.keys(data).forEach(key => {
        (this as any)[key] = (data as any)[key];
      });
      return this as any;
    });
  }

  async delete() {
    return TypeMetadataStorage.delete(this.constructor, this.id) as any;
  }
}
