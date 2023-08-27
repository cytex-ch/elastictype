import { Type } from "@nestjs/common";
import { BaseSchemaInterface } from "..";

/**
 * @module query
 * @description This module provides the Query class for creating Elasticsearch queries.
 */

/**
 * @typedef {string} Operator - The operator used in a query condition.
 * @values "eq" | "gt" | "gte" | "lt" | "lte" | "ne" | "exists"
 */

type Operator = "eq" | "gt" | "gte" | "lt" | "lte" | "ne" | "exists" | "match";
/**
 * @typedef {string} BoolOperator - The boolean operator used to combine multiple query conditions.
 * @values "and" | "or"
 */
type BoolOperator = "and" | "or";

/**
 * @class Query
 * @template T - The type of the schema interface used for querying.
 * @description Represents a query object for Elasticsearch.
 */
export class Query<T extends BaseSchemaInterface> {
  private indexName: string;
  private typeName?: string;

  private size?: number;

  private cls?: Type<T>;

  private fields = new Array<keyof T | "_id">();
  private from?: number;

  private whereClauses: {
    field: keyof T;
    operator: string;
    value: T[keyof T] | T[keyof T][];

    boolOperator?: BoolOperator;
  }[] = [];

  /**
   * @constructor
   * @param {string} indexName - The name of the Elasticsearch index.
   * @param {string} typeName - The name of the Elasticsearch type.
   * @param {Type<T>} t - The type of the schema interface class.
   */
  private constructor(indexName: string, typeName?: string, t?: Type<T>) {
    this.indexName = indexName;
    this.typeName = typeName;
    this.cls = t;
  }

  /**
   * @static
   * @method init
   * @param {string} indexName - The name of the Elasticsearch index.
   * @param {string} typeName - The name of the Elasticsearch type.
   * @returns {Query} - A new instance of the Query class.
   * @description Initializes a new query object.
   */
  static init(indexName: string, typeName: string): Query<any> {
    return new Query(indexName, typeName);
  }

  /**
   * @static
   * @method with
   * @template T - The type of the schema interface class.
   * @param {Type<T>} cls - The schema interface class.
   * @returns {Query<T>} - A new instance of the Query class.
   * @description Initializes a new query object with the specified schema interface class.
   */
  static with<T extends BaseSchemaInterface>(cls: Type<T>): Query<T> {
    return new Query<T>(cls.name, cls.name, cls);
  }

  /**
   * @method limit
   * @param {number} size - The maximum number of documents to return in the query result.
   * @returns {Query<T>} - The updated query object.
   * @description Sets the limit for the query result.
   */
  limit(size: number): Query<T> {
    this.size = size;
    return this;
  }

  /**
   * @method skip
   * @param {number} from - The number of documents to skip in the query result.
   * @returns {Query<T>} - The updated query object.
   * @description Sets the number of documents to skip in the query result.
   */
  skip(from: number) {
    this.from = from;
    return this;
  }

  /**
   * @method where
   * @param {keyof T} field - The field to query on.
   * @param {Operator} operator - The operator for the query condition.
   * @param {T[keyof T] | T[keyof T][]} value - The value(s) to query for.
   * @returns {Query<T>} - The updated query object.
   * @description Adds a query condition to the query.
   */
  where(field: keyof T, operator: Operator, value: T[keyof T] | T[keyof T][]) {
    this.whereClauses.push({
      field,
      operator,
      value: Array.isArray(value) ? value : [value],
      boolOperator: "and",
    });
    return this;
  }

  /**
   * @method andWhere
   * @param {keyof T} field - The field to query on.
   * @param {Operator} operator - The operator for the query condition.
   * @param {T[keyof T][]} value - The value(s) to query for.
   * @returns {Query<T>} - The updated query object.
   * @description Adds an additional query condition with "AND" operator to the query.
   */
  andWhere(field: keyof T, operator: Operator, value: T[keyof T][]) {
    this.whereClauses.push({ field, operator, value, boolOperator: "and" });
    return this;
  }

  /**
   * @method orWhere
   * @param {keyof T} field - The field to query on.
   * @param {Operator} operator - The operator for the query condition.
   * @param {T[keyof T]} value - The value to query for.
   * @returns {Query<T>} - The updated query object.
   * @description Adds an additional query condition with "OR" operator to the query.
   */
  orWhere(field: keyof T, operator: Operator, value: T[keyof T]) {
    this.whereClauses.push({ field, operator, value, boolOperator: "or" });
    return this;
  }

  /**
   * @private
   * @method compileWhereClauses
   * @returns {any[]} - The compiled Elasticsearch query conditions.
   * @description Compiles the query conditions into Elasticsearch query format.
   */
  private compileWhereClauses() {
    return this.whereClauses.map((clause) => {
      const { field, operator, value, boolOperator } = clause;
      const query: any = {};
      if (boolOperator) {
        query.bool = {
          [boolOperator === "and" ? "must" : "should"]: (Array.isArray(value)
            ? value
            : [value]
          ).map((value) => ({
            [operator]: {
              [field]: Array.isArray(value) ? value?.[0] : value,
            },
          })),
        };
      } else {
        query[operator] = {
          [field]: value,
        };
      }

      return query;
    });
  }

  /**
   * @method compile
   * @returns {any} - The compiled Elasticsearch query.
   * @description Compiles the query object into Elasticsearch query format.
   */
  compile() {
    const query: any = {
      query: this.compileWhereClauses().reduce(
        (acc, cur) => ({
          ...acc,
          ...cur,
        }),
        {}
      ),
    };

    if (this.size) {
      query.size = this.size;
    }

    if (this.from) {
      query.from = this.from;
    }

    query.fields = this.fields;

    return query;
  }

  /**
   * @async
   * @method find
   * @returns {Promise<T[]>} - The query result.
   * @description Executes the query and returns the result.
   */
  async find(): Promise<T[]> {
    return TypeMetadataStorage.findByQuery(
      this.cls as Type<T>,
      { ...this.compile().query },
      this.size,
      this.from
    );
  }

  async findAll(): Promise<T[]> {
    return TypeMetadataStorage.findAll(this.cls as Type<T>, this.fields);
  }

  select(...fields: (keyof T | "_id")[]): Query<T> {
    this.fields = fields;
    return this;
  }

  /**
   * @async
   * @method findOne
   * @param {string} id - The ID of the document to find.
   * @returns {Promise<any>} - The found document.
   * @description Finds a single document by ID.
   */
  async findOne(id: string): Promise<T> {
    return TypeMetadataStorage.findOne(this.cls as Type<T>, id, this.fields);
  }
}
