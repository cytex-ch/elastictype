export enum ElasticDataType {
  Text = 'text',
  Keyword = 'keyword',
  Long = 'long',
  Integer = 'integer',
}

export interface SchemaOptions {
  index: string;
}

export interface FieldOptions {
  type: ElasticDataType;
  description?: string;
}

export type Type<T> = new (...args: any[]) => T;
