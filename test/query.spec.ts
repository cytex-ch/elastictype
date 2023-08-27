import { Client } from "@elastic/elasticsearch";
import { readFileSync } from "fs";
import { BaseSchema, ElasticDataType, Prop, Schema } from "../src";
import { Query } from "../src/query/query";
import { mock } from "./utils/mock-connection";

@Schema({ index: "test88" })
class Test extends BaseSchema<Test> {
  @Prop(ElasticDataType.Text)
  name!: string;
}

describe("Query", () => {
  beforeAll(async () => {
    TypeMetadataStorage.setClient(
      new Client({
        node: "https://localhost:9200",
        auth: {
          apiKey:
            "cmZvZ0tZb0JWNElqajBqcDBLOEE6dGhhZFFMMTFTM09vaUlkOExhMXZuZw==",
        },
        Connection: mock.getConnection(),
      })
    );
  });

  test("should be able to create a query", () => {
    const query = Query.init("test", "test");
    expect(query).toBeInstanceOf(Query);
  });
  test("should be able to create a query with a type", async () => {
    const query = Query.with(Test)
      .where("name", "match", ["asdf", "asdf"])
      .limit(1)
      .skip(6);

    expect(query).toBeInstanceOf(Query);

    const compiled = query.compile();
    expect(compiled.query).toEqual({
      bool: {
        must: [
          {
            match: {
              name: "asdf",
            },
          },
          {
            match: {
              name: "asdf",
            },
          },
        ],
      },
    });

    const t = new Test();
    t.name = "asdf";
    await t.save();

    const results = await Test.findByQuery<Test>(
      compiled.query,
      compiled.size,
      compiled.from
    );

    const results2 = await query.find();

    const q2 = Query.with(Test).select("_id", "name").findOne(results[0].id);
    const result3 = await q2;

    const q3 = Query.with(Test).select("name").findAll();
    const result4 = await q3;

    console.log(result4 as any);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual("asdf");
  });
});
