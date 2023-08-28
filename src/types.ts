export enum ElasticDataType {
  Text = "text",
  Keyword = "keyword",
  Long = "long",
  Integer = "integer",
}
export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}
