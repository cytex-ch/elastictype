/**
 * @file Schema Metadata
 * @module schema.metadata.ts
 * @description This file contains the definition of the SchemaMetadata interface.
 * It describes the metadata for a schema in an ElasticType project.
 * @remarks
 * The SchemaMetadata interface is used to define the structure and properties of a schema.
 * It includes the target function, options, and optional properties.
 * @see {@link PropertyMetadata}
 */

import {PropertyMetadata} from './property-metadata';

/**
 * Interface representing the metadata for a schema in an ElasticType project.
 * @interface
 */
export interface SchemaMetadata {
  /**
   * The target function of the schema.
   * @remarks
   * The target function represents the schema class or constructor function.
   * @type {Function}
   */
  target: Object;

  constructorName: string;

  /**
   * The options for the schema.
   * @remarks
   * The options object contains an "index" property that specifies the index name for the schema.
   * @type {{ index: string }}
   */
  options: {index: string} | undefined;

  /**
   * The properties of the schema.
   * @remarks
   * The properties array includes the metadata for each property of the schema.
   * @type {PropertyMetadata[]}
   */
  properties?: PropertyMetadata[];
}
