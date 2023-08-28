import { Injectable } from "@nestjs/common";
import { BaseSchemaInterface } from "..";

@Injectable()
export class IndexService<T> {
  constructor(private readonly _indexName: string, private readonly cls: any) {}

  public get _index() {
    return this._indexName;
  }

  public async findAll(): Promise<BaseSchemaInterface[]> {
    return this.cls.findAll();
  }

  public async create(data: Partial<T>): Promise<BaseSchemaInterface> {
    const instance = new this.cls(data);
    return instance.save();
  }
}
