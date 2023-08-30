import {Client} from '@elastic/elasticsearch';
import {BaseSchema, ElasticDataType, Prop, Schema} from '../src';
import {Query} from '../src/query/query';
import {mock} from './utils/mock-connection';

@Schema({index: 'test88'})
class Test extends BaseSchema<Test> {
  @Prop({
    type: ElasticDataType.Text,
  })
  public name!: string;
}

describe('Query', () => {
  beforeAll(async () => {
    TypeMetadataStorage.setClient(
      new Client({
        node: 'https://localhost:9200',
        auth: {
          apiKey:
            'cmZvZ0tZb0JWNElqajBqcDBLOEE6dGhhZFFMMTFTM09vaUlkOExhMXZuZw==',
        },
        Connection: mock.getConnection(),
      })
    );
  });

  test('should be able to create a query', () => {
    const query = Query.init('test', 'test');
    expect(query).toBeInstanceOf(Query);
  });
  test('should be able to create a query with a type', async () => {
    const query = Query.with(Test)
      .where('name', 'match', ['asdf', 'asdf'])
      .limit(1)
      .skip(6);

    expect(query).toBeInstanceOf(Query);

    const compiled = query.compile();
    expect(compiled.query).toEqual({
      bool: {
        must: [
          {
            match: {
              name: 'asdf',
            },
          },
          {
            match: {
              name: 'asdf',
            },
          },
        ],
      },
    });

    const t = new Test();
    t.name = 'asdf';
    await t.save();

    const results = await Test.findByQuery<Test>(
      compiled.query,
      compiled.size,
      compiled.from
    );

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('asdf');
  });
});
