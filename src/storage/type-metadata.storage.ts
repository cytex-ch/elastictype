import {type Client} from '@elastic/elasticsearch';
import {type QueryDslQueryContainer} from '@elastic/elasticsearch/lib/api/types';
import {BaseSchema} from '..';
import {type HookMetadata} from '../metadata/hook-metadata';
import {type PropertyMetadata} from '../metadata/property-metadata';
import {type SchemaMetadata} from '../metadata/schema.metadata';
import {Type, type ElasticDataType} from '../types';
export class TypeMetadataStorageHost {
  private properties = new Array<PropertyMetadata>();
  private schemata = new Array<SchemaMetadata>();
  private readonly hooks = new Array<HookMetadata>();
  public client!: Client;

  protected _constructor_name = '';

  constructor() {}

  setClient(client: Client) {
    this.client = client;
  }

  addProperty(property: PropertyMetadata) {
    this.properties.push(property);
  }

  addSchema(schema: SchemaMetadata) {
    this.schemata.push(schema);
  }

  addHook(hook: HookMetadata) {
    this.hooks.push(hook);
  }

  getSchema(target: any | string) {
    if (typeof target === 'string') {
      return this.schemata.find(s => s.constructorName === target);
    }

    let schema = this.schemata.find(s => s.target === target);
    if (!schema) {
      schema = this.schemata.find(s => s.target === target.prototype);
    }
    return schema;
  }

  getPropertiesForSchema(target: Function) {
    const properties = this.properties.filter(p => p.target === target);
    const indexName = this.getSchema(target)?.options?.index;

    return {
      properties,
      indexName,
      clsName: target,
    };
  }

  getMapping(target: Function) {
    const properties = this.getPropertiesForSchema(target);
    const mapping = {
      properties: properties.properties.reduce<Record<string | symbol, any>>(
        (acc, p) => {
          acc[p.propertyKey] = {
            description: p.options?.description,
            type: (p.options as {type: ElasticDataType}).type,
          };
          return acc;
        },
        {}
      ),
    };
    return mapping;
  }

  async syncMapping(target: Function) {
    const schema = this.getSchema(target);
    const mapping = this.getMapping(target);

    if (!schema) throw new Error('Schema not found');

    // check if index exists
    const exists = await this.client.indices.exists({
      index: schema.options?.index ?? '',
    });

    if (exists) {
      // delete index
      await this.client.indices.delete({
        index: schema.options?.index ?? '',
      });
    }

    // create index
    await this.client.indices.create({
      index: schema.options?.index ?? '',
      body: {
        mappings: mapping,
      },
    });

    return true;
  }

  private async execHook(
    name:
      | 'preSave'
      | 'postSave'
      | 'preUpdate'
      | 'postUpdate'
      | 'preDelete'
      | 'postDelete',
    target: Function,
    data: any
  ) {
    const fnName = this.hooks.find(h => h.target === target && h.name === name)
      ?.value.name;

    if (fnName) {
      const fn = target.prototype[fnName];
      if (fn) {
        return fn.call(data);
      }
    }

    return await Promise.resolve(data);
  }

  async save(target: Function, data: any) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error('Schema not found');

    await this.execHook('preSave', target, data);

    const result = await this.client.index({
      index: schema.options?.index ?? '',
      body: data,
      refresh: true,
    });

    const postHookResult = await this.execHook('postSave', target, data);

    return {
      ...result,
      ...postHookResult,
    };
  }

  async delete(target: Function, id: string): Promise<boolean> {
    const schema = this.getSchema(target);
    if (!schema) throw new Error('Schema not found');

    this.execHook('preDelete', target, id);

    const result = await this.client
      .delete({
        index: schema.options?.index ?? '',
        id,
      })
      .then(res => res.result.toString() === 'deleted');

    this.execHook('postDelete', target, id);

    return result;
  }

  async findOne<T extends BaseSchema<T>>(
    target: T | string,
    id: string,
    fields: (keyof T)[] = []
  ) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error('Schema not found');
    return await this.client
      .get<T>({
        index: schema.options?.index ?? '',
        id,
      })
      .then(res => ({
        id: res._id,
        ...(fields.length > 0
          ? Object.fromEntries(
              fields.map(key => [
                key,
                key === '_id' ? res._id : res?._source?.[key],
              ])
            )
          : res._source),
      }))
      .catch(err => {
        if (err.meta.statusCode === 404) return undefined;
        /* istanbul ignore next */
        throw err;
      });
  }

  async findByQuery<T extends BaseSchema<T>>(
    target: Type<T> | string,
    query: QueryDslQueryContainer,
    size = 10000,
    from = 0
  ) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error('Schema not found');
    return await this.client

      .search<T>({
        index: schema.options?.index ?? '',
        query,
        size,
        from,
      })
      .then(res => {
        return res.hits.hits.map(h => ({
          id: h._id,
          ...h._source,
        }));
      });
  }

  async findAll<T>(
    target: T | string,
    fields?: (any[] | undefined) | undefined
  ): Promise<T[]> {
    const schema = this.getSchema(target);
    if (!schema) throw new Error('Schema not found');

    return await this.client
      .search<T>({
        index: schema.options?.index ?? '',
        body: {
          query: {
            match_all: {},
          },
        },
        fields,
      })
      .then(res => {
        return res.hits.hits.map(h => ({
          id: h._id,
          ...(fields?.length ?? 0 > 0
            ? Object.fromEntries(
                Object.entries((h.fields ?? {}) as Record<string, any[]>).map(
                  ([key, value]) => [key, value[0]]
                )
              )
            : h._source),
        }));
      })
      .then(res => res as unknown as Promise<T[]>);
  }

  async update(target: Function, id: string, data: any) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error('Schema not found');

    await this.execHook('preUpdate', target, data);

    const result = this.client
      .update({
        index: schema.options?.index ?? '',
        id,
        body: {
          doc: data,
        },
        refresh: true,
      })
      .then(res => res.result.toString() === 'updated');

    await this.execHook('postUpdate', target, data);

    return await result;
  }

  getSchemata() {
    return this.schemata;
  }

  getProperties() {
    return this.properties;
  }

  getPropertiesForTarget(target: Function) {
    return this.properties.filter(p => p.target === target);
  }

  clear() {
    this.schemata = [];
    this.properties = [];
  }

  async sql(target: Function, sql: string) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error('Schema not found');
    return await this.client.sql.query({
      query: sql,
    });
  }

  async updateByQuery<T extends BaseSchema<T>>(
    target: Type<T> | string,
    query: any,
    data: any
  ) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error('Schema not found');
    return await this.client
      .updateByQuery({
        index: schema.options?.index ?? '',

        body: {
          query,
          script: {
            source: 'ctx._source.name = params.name',
            params: {
              name: data.name,
            },
          },
        },
        refresh: true,
      })
      .then(async () => {
        return await this.findByQuery<T>(target, query);
      });
  }

  async count(target: Function) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error('Schema not found');
    return await this.client
      .count({
        index: schema.options?.index ?? '',
      })
      .then(res => res.count);
  }

  async exists(target: Function, id: string) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error('Schema not found');
    return await this.client
      .get({
        index: schema.options?.index ?? '',
        id,
      })
      .then(res => res.found)
      .catch(err => {
        if (err.meta.statusCode === 404) return false;
        /* istanbul ignore next */
        throw err;
      });
  }
}
declare global {
  /* ~ Here, declare things that go in the global namespace, or augment
   *~ existing declarations in the global namespace
   */

  const TypeMetadataStorage: TypeMetadataStorageHost;
}
const globalRef = global as {TypeMetadataStorage?: TypeMetadataStorageHost};
export const TypeMetadataStorage: TypeMetadataStorageHost =
  globalRef.TypeMetadataStorage ||
  (globalRef.TypeMetadataStorage = new TypeMetadataStorageHost());
