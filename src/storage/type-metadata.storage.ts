import { Client } from "@elastic/elasticsearch";
import { QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";
import { HookMetadata } from "../metadata/hook-metadata";
import { PropertyMetadata } from "../metadata/property-metadata";
import { SchemaMetadata } from "../metadata/schema.metadata";
import { ElasticDataType } from "../types";

export class TypeMetadataStorageHost {
  private properties = new Array<PropertyMetadata>();
  private schemata = new Array<SchemaMetadata>();
  private hooks = new Array<HookMetadata>();
  public client!: Client;

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

  getSchema(target: Function) {
    return this.schemata.find((s) => s.target === target);
  }

  getPropertiesForSchema(target: Function) {
    const properties = this.properties.filter((p) => p.target === target);
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
      properties: properties.properties.reduce((acc, p) => {
        acc[p.propertyKey] = {
          description: (p.options as any)?.description,
          type: (p.options as { type: ElasticDataType }).type,
        };
        return acc;
      }, {} as { [key: string | symbol]: any }),
    };
    return mapping;
  }

  async syncMapping(target: Function) {
    const schema = this.getSchema(target);
    const mapping = this.getMapping(target);

    if (!schema) throw new Error("Schema not found");

    // check if index exists
    const exists = await this.client.indices.exists({
      index: schema.options.index,
    });

    if (exists) {
      // delete index
      await this.client.indices.delete({
        index: schema.options.index,
      });
    }

    // create index
    await this.client.indices.create({
      index: schema.options.index,
      body: {
        mappings: mapping,
      },
    });

    return true;
  }

  private async execHook(
    name:
      | "preSave"
      | "postSave"
      | "preUpdate"
      | "postUpdate"
      | "preDelete"
      | "postDelete",
    target: Function,
    data: any
  ) {
    const fnName = this.hooks.find(
      (h) => h.target === target && h.name === name
    )?.value.name;

    if (fnName) {
      const fn = target.prototype[fnName];
      if (fn) {
        return fn.call(data);
      }
    }

    return Promise.resolve(data);
  }

  async save(target: Function, data: any) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error("Schema not found");

    await this.execHook("preSave", target, data);

    const result = await this.client.index({
      index: schema.options.index,
      body: data,
      refresh: true,
    });

    const postHookResult = await this.execHook("postSave", target, data);

    return {
      ...result,
      ...postHookResult,
    };
  }

  async delete(target: Function, id: string): Promise<boolean> {
    const schema = this.getSchema(target);
    if (!schema) throw new Error("Schema not found");

    this.execHook("preDelete", target, id);

    const result = await this.client
      .delete({
        index: schema.options.index,
        id,
      })
      .then((res) => res["result"].toString() === "deleted");

    this.execHook("postDelete", target, id);

    return result;
  }

  async findOne(target: Function, id: string, fields: any[] = []) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error("Schema not found");
    return this.client
      .get({
        index: schema.options.index,
        id,
      })
      .then((res) => ({
        id: res["_id"],
        ...(fields.length > 0
          ? (Object.fromEntries(
              fields.map((key) => [
                key,
                key == "_id" ? res["_id"] : (res["_source"] as any)?.[key],
              ])
            ) as any)
          : res["_source"]),
      }))
      .catch((err) => {
        if (err.meta.statusCode === 404) return undefined;
        /* istanbul ignore next */
        throw err;
      });
  }

  async findByQuery(
    target: Function,
    query: QueryDslQueryContainer,
    size = 10000,
    from = 0
  ) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error("Schema not found");
    return this.client

      .search({
        index: schema.options.index,
        query: query,
        size,
        from,
      })
      .then((res) => {
        return res.hits.hits.map((h) => ({
          id: h._id,
          ...(h._source as any),
        }));
      });
  }

  async findAll(target: Function, fields?: (any[] | undefined) | undefined) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error("Schema not found");

    return this.client
      .search({
        index: schema.options.index,
        body: {
          query: {
            match_all: {},
          },
        },
        fields,
      })
      .then((res) => {
        return res.hits.hits.map((h) => ({
          id: h._id,
          ...(fields?.length ?? 0 > 0
            ? (Object.fromEntries(
                Object.entries(
                  (h.fields ?? {}) as { [key: string]: any[] }
                ).map(([key, value]) => [key, value[0]])
              ) as any)
            : (h._source as any)),
        }));
      });
  }

  async update(target: Function, id: string, data: any) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error("Schema not found");

    await this.execHook("preUpdate", target, data);

    const result = this.client
      .update({
        index: schema.options.index,
        id,
        body: {
          doc: data,
        },
        refresh: true,
      })
      .then((res) => res["result"].toString() === "updated");

    await this.execHook("postUpdate", target, data);

    return result;
  }

  getSchemata() {
    return this.schemata;
  }

  getProperties() {
    return this.properties;
  }

  getPropertiesForTarget(target: Function) {
    return this.properties.filter((p) => p.target === target);
  }

  clear() {
    this.schemata = [];
    this.properties = [];
  }

  async sql(target: Function, sql: string) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error("Schema not found");
    return this.client.sql.query({
      query: sql,
    });
  }

  async updateByQuery(target: Function, query: any, data: any) {
    const schema = this.getSchema(target);

    if (!schema) throw new Error("Schema not found");
    return this.client
      .updateByQuery({
        index: schema.options.index,

        body: {
          query,
          script: {
            source: "ctx._source.name = params.name",
            params: {
              name: data.name,
            },
          },
        },
        refresh: true,
      })
      .then((res) => {
        return this.findByQuery(target, query);
      });
  }

  async count(target: Function) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error("Schema not found");
    return this.client
      .count({
        index: schema.options.index,
      })
      .then((res) => res.count as number);
  }

  async exists(target: Function, id: string) {
    const schema = this.getSchema(target);
    if (!schema) throw new Error("Schema not found");
    return this.client
      .get({
        index: schema.options.index,
        id,
      })
      .then((res) => res.found)
      .catch((err) => {
        if (err.meta.statusCode === 404) return false;
        /* istanbul ignore next */
        throw err;
      });
  }
}
declare global {
  /*~ Here, declare things that go in the global namespace, or augment
   *~ existing declarations in the global namespace
   */

  const TypeMetadataStorage: TypeMetadataStorageHost;
}
const globalRef = global as any & {
  TypeMetadataStorage: TypeMetadataStorageHost;
};
export const TypeMetadataStorage: TypeMetadataStorageHost =
  globalRef.TypeMetadataStorage ||
  (globalRef.TypeMetadataStorage = new TypeMetadataStorageHost());
