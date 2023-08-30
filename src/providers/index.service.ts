import {Injectable} from '@nestjs/common';
import {BaseSchema, Type} from '..';

@Injectable()
export class IndexService<T extends BaseSchema<T>> {
  constructor(
    private readonly _indexName: string,
    private readonly cls: Type<BaseSchema<T>>
  ) {}

  public get _index() {
    return this._indexName;
  }

  public async findAll(): Promise<T[]> {
    return (this.cls as any).findAll();
  }

  public async create(data: Partial<T>): Promise<T> {
    const instance = new this.cls(data);
    return instance.save();
  }
}
