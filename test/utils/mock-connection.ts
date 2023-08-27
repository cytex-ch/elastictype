import { errors } from "@elastic/elasticsearch";
import { MockPattern } from "@elastic/elasticsearch-mock";
import {
  UpdateResponse,
  GetResponse,
  UpdateByQueryResponse,
  GetGetResult,
  SearchResponse,
  CountResponse,
} from "@elastic/elasticsearch/lib/api/types";
const Mock = require("@elastic/elasticsearch-mock");

import { randomUUID } from "crypto";

const mock = new Mock();

let cats: any[] = [];
let dogs: any[] = [];

let existingIndices = [] as string[];

const getParams = (params: MockPattern, path: string) => {
  const paramKeys = path.split("/");

  return paramKeys.reduce((acc, p) => {
    if (p.startsWith(":")) {
      acc[p.replace(":", "")] = params.path?.toString()?.split("/")?.[
        paramKeys.indexOf(p)
      ];
    }
    return acc;
  }, {} as { [key: string]: string });
};

mock
  .add(
    {
      method: "DELETE",
      path: "/:index",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index");
      const index = params["index"];

      if (index && existingIndices.includes(index)) {
        existingIndices = existingIndices.filter((i) => i !== index);
      }

      return {
        acknowledged: true,
      };
    }
  )
  .add(
    {
      method: "DELETE",
      path: "/:index/_doc/:id",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_doc/:id");
      const index = params["index"];
      const id = params["id"];

      cats = (index === "dogs" ? dogs : cats).filter((c) => c.id !== id);

      return {
        result: "deleted",
        _index: index,
        _type: "_doc",
        _id: id,
        _version: 2,
        _shards: {
          total: 2,
          successful: 1,
          failed: 0,
        },
        _seq_no: 1,
        _primary_term: 1,
      };
    }
  )
  .add(
    {
      method: "POST",
      path: "/:index/_doc",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_doc");
      const index = params["index"];

      const id = randomUUID();
      (index === "dogs" ? dogs : cats).push({
        _id: id,
        id,
        ...body.body,
      });

      return {
        _index: index,
        _id: id,
        _version: 1,
        result: "created",
        forced_refresh: true,
        _shards: { total: 2, successful: 1, failed: 0 },
        _seq_no: 2,
        _primary_term: 1,
      };
    }
  )
  .add(
    {
      method: "POST",
      path: "/_sql",
    },
    (body: MockPattern) => {
      const sql = (body.body as any).query;

      // example: SELECT * FROM cats WHERE name = 'Abyssinian'

      const [, index, column, value] =
        /SELECT \* FROM (.*) WHERE (.*) = '(.*)'/.exec(sql) ?? [];

      const hits = (index === "dogs" ? dogs : cats).filter((c) => {
        return c[column] === value;
      });

      return {
        columns: [
          {
            name: "name",
            type: "text",
          },
          {
            name: "age",
            type: "long",
          },
          {
            name: "age",
            type: "long",
          },
        ],
        rows: hits.map((h) => [h.age, h.id, h.name]),
      };
    }
  )
  .add(
    {
      method: "POST",
      path: "/:index/_update/:id",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_doc/:id");
      const index = params["index"];
      const id = params["id"];

      const data = body.body as any;

      const exising = (index === "dogs" ? dogs : cats).find(
        (c) => c._id === id
      );

      if (!exising) {
        return new errors.ResponseError({
          statusCode: 404,
          body: {
            errors: {},
            status: 404,
          },
          warnings: [],
          headers: {},
          meta: {} as any,
        });
      }

      if (index === "dogs") {
        dogs.splice(
          dogs.findIndex((c) => c.id === id),
          1,

          { ...exising, ...data.doc }
        );
      } else {
        cats.splice(
          cats.findIndex((c) => c.id === id),
          1,
          { ...exising, ...data.doc }
        );
      }

      return <UpdateResponse>{
        _index: index,
        found: true,
        _type: "_doc",
        _id: id,
        _version: 2,
        result: "updated",
        _shards: {
          total: 2,
          successful: 1,
          failed: 0,
        },
        _seq_no: 1,
        _primary_term: 1,
      };
    }
  )
  .add(
    {
      method: "HEAD",
      path: "/:index",
    } as any,
    (body: MockPattern) => {
      const params = getParams(body, "/:index");
      const index = params["index"];

      const exists = !!existingIndices.includes(index);

      if (!exists) {
        return new errors.ResponseError({
          statusCode: 404,
          body: {
            errors: {},
            status: 404,
          },
          warnings: [],
          headers: {},
          meta: {} as any,
        });
      }

      return true;
    }
  )

  .add(
    {
      method: "HEAD",
      path: "/:index/_doc/:id",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_doc/:id");
      const index = params["index"];
      const id = params["id"];

      if (index === "dogs") {
        return dogs.filter((c) => c._id === id).length > 0 ? true : false;
      } else {
        return cats.filter((c) => c._id === id).length > 0 ? true : false;
      }
    }
  )
  .add(
    {
      method: "GET",
      path: "/:index/_mapping",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_mapping");
      const index = params["index"];

      const mapping = {
        properties: {
          name: {
            type: "keyword",
          },
          age: {
            type: "integer",
          },
        },
      };

      return {
        [index]: {
          mappings: mapping,
        },
      };
    }
  )

  .add(
    {
      method: "GET",
      path: "/:index/_doc/:id",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_doc/:id");
      const index = params["index"];
      const id = params["id"];

      const found = (index === "dogs" ? dogs : cats).filter((c) => {
        return c.id === id;
      })?.[0];
      if (!found) {
        // not found
        return new errors.ResponseError({
          statusCode: 404,
          body: {
            errors: {},
            status: 404,

            message: "Not found",
          },
          warnings: [],
          headers: {},
          meta: {} as any,
        });
      }
      return <GetResponse>{
        _index: index,
        _type: "_doc",
        _id: id,
        _version: 1,
        _seq_no: 0,
        _primary_term: 1,
        found: !!found,
        _source: found,
      };
    }
  )
  .add(
    {
      method: "PUT",
      path: "/:index",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index");
      const index = params["index"];

      if (!existingIndices.includes(index)) {
        existingIndices.push(index);
      }

      return {
        acknowledged: true,
      };
    }
  )
  .add(
    {
      method: "POST",
      path: "/:index/_update_by_query",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_update_by_query");
      const index = params["index"];

      const query = (body.body as any)?.query;

      const hits = (index === "dogs" ? dogs : cats)
        .filter((c) => {
          if (query.match) {
            return c.name === (query.match as any).name;
          }

          if (query.match_all) {
            return true;
          }

          return false;
        })
        .map((c) => ({
          _index: index,
          _type: "_doc",
          _id: c.id,
          _score: 1,
          _source: c,
        }));

      for (const hit of hits) {
        const data = (body.body as any).script.params;

        if (index === "dogs") {
          dogs.splice(
            dogs.findIndex((c) => c.id === hit._id),
            1,

            { ...hit._source, ...data }
          );
        } else {
          cats.splice(
            cats.findIndex((c) => c.id === hit._id),
            1,
            { ...hit._source, ...data }
          );
        }
      }

      return <UpdateByQueryResponse>{
        updated: hits.length,
      };

      // return {
      //   took: 1,
    }
  )

  .add(
    {
      method: "POST",
      path: "/:index/_search",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_search");
      const index = params["index"];

      const isFindByQuery =
        Object.keys(body.body ?? {}).includes("query") &&
        Object.keys((body.body as any).query ?? {}).includes("match");

      let hits = [] as any[];
      if (isFindByQuery) {
        const query = (body.body as any).query;

        hits = (index === "dogs" ? dogs : cats)
          .filter((c) => {
            if (query.match) {
              return c.name === (query.match as any).name;
            }

            if (query.match_all) {
              return true;
            }

            return false;
          })
          .map(
            (c) =>
              <GetGetResult>{
                _index: index,
                _type: "_doc",
                _id: c.id,
                _score: 1,
                _source: c,
                found: true,
              }
          );
      } else {
        hits = (index === "dogs" ? dogs : cats).map(
          (c) =>
            <GetGetResult>{
              _index: index,
              _type: "_doc",
              _id: c.id,
              _score: 1,
              _source: c,
              found: true,
            }
        );
      }

      return <SearchResponse>{
        hits: {
          hits: hits,
        },
      };
    }
  )

  .add(
    {
      method: "GET",
      path: "/:index/_count",
    },
    (body: MockPattern) => {
      const params = getParams(body, "/:index/_count");
      const index = params["index"];

      const count = (index === "dogs" ? dogs : cats).length;

      return <CountResponse>{
        count,
      };
    }
  );

export { mock };
