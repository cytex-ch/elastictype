import { Inject, Type } from "@nestjs/common";

import { DEFAULT_DB_CONNECTION } from "../elastictype.constants";
import { BaseSchemaInterface } from "..";

export const InjectIndex = (
  index: Type<BaseSchemaInterface>,
  connectionName?: string
) => Inject(getIndexToken(index.name, connectionName));

export function getIndexToken(index: string, connectionName?: string) {
  if (connectionName === undefined) {
    return `${index}Index`;
  }
  return `${getConnectionToken(connectionName)}/${index}Index`;
}

export function getConnectionToken(name?: string) {
  return name && name !== DEFAULT_DB_CONNECTION
    ? `${name}Connection`
    : DEFAULT_DB_CONNECTION;
}
