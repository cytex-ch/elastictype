import {Client} from '@elastic/elasticsearch';
import {faker} from '@faker-js/faker';
import {BaseSchema, TypeMetadataStorage} from '../src';
import {Cat} from './models/cat';
import {Dog} from './models/dog';
import {mock} from './utils/mock-connection';

jest.setTimeout(10000);

describe('Metadata', () => {
  test('should be defined', () => {
    expect(TypeMetadataStorage).toBeDefined();
  });

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

  afterAll(async () => {
    await TypeMetadataStorage.client.indices
      .delete({
        index: 'cats',
      })
      .catch(() => {
        console.log('Failed to delete index');
      });
    await TypeMetadataStorage.client.indices
      .delete({
        index: 'dogs',
      })
      .catch(() => {
        console.log('Failed to delete index');
      });
  });

  test('cannot get schema for non schema class', () => {
    class NoSchema {}

    const schema = TypeMetadataStorage.getSchema(NoSchema);
    expect(schema).toBeUndefined();
  });

  test("when syncing, removes previous index if it exists, then creates a new index with the schema's mapping", async () => {
    const schema = TypeMetadataStorage.getSchema(Cat);
    expect(schema).toBeDefined();

    const mapping = TypeMetadataStorage.getMapping(Cat);
    expect(mapping).toBeDefined();

    const indexName = schema?.options?.index || '';
    expect(indexName).toBeDefined();

    const exists = await TypeMetadataStorage.client.indices.exists({
      index: indexName?.toString() || '',
    });
    expect(exists).toBe(false);

    await TypeMetadataStorage.syncMapping(Cat);

    const exists2 = await TypeMetadataStorage.client.indices.exists({
      index: indexName?.toString() || '',
    });
    expect(exists2).toBe(true);

    const mapping2 = await TypeMetadataStorage.client.indices.getMapping({
      index: schema?.options?.index,
    });

    expect(mapping2[indexName]?.mappings?.properties?.['name'].type).toBe(
      'keyword'
    );
    expect(mapping2[indexName]?.mappings?.properties?.['age'].type).toBe(
      'integer'
    );
  });

  test('cannot sync mapping for non schema class', async () => {
    class NoSchema {}
    expect(TypeMetadataStorage.syncMapping(NoSchema)).rejects.toThrowError();
  });

  test('should add schema metadata', async () => {
    const schema = TypeMetadataStorage.getSchema(Cat);
    expect(schema).toBeDefined();
    expect(schema?.options?.index).toBe('cats');

    const Schema2 = TypeMetadataStorage.getSchema(Dog);
    expect(Schema2).toBeDefined();
    expect(Schema2?.options?.index).toBe('dogs');

    const schemas = TypeMetadataStorage.getSchemata();
    expect(schemas).toBeDefined();
    expect(schemas.length).toBe(2);

    expect(schemas[0].options?.index).toBe('cats');
    expect(schemas[1].options?.index).toBe('dogs');

    TypeMetadataStorage.syncMapping(Dog);
  });

  test("can find one by id, and can't find one that does not exist", async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});

    const savedCat = await cat.save();

    const foundCat = await Cat.findOne<Cat>(savedCat.id);

    expect(foundCat).toBeDefined();
    expect(foundCat.id).toBe(savedCat.id);
    expect(foundCat.name).toBe(savedCat.name);
    expect(foundCat.age).toBe(savedCat.age);

    const foundCat2 = await Cat.findOne<Cat>('FOO');
    expect(foundCat2).toBeUndefined();
  });

  test('can get mapping', async () => {
    const mapping = TypeMetadataStorage.getMapping(Cat);

    expect(mapping).toBeDefined();
    console.log(mapping);
    expect(mapping.properties['name'].type).toBe('keyword');
    expect(mapping.properties['age'].type).toBe('integer');
  });

  test('can sync mapping', async () => {
    const mapping = TypeMetadataStorage.getMapping(Cat);
    expect(mapping).toBeDefined();
    expect(mapping.properties['name'].type).toBe('keyword');
    expect(mapping.properties['age'].type).toBe('integer');

    const result = await TypeMetadataStorage.syncMapping(Cat);
    expect(result).toBeDefined();
    expect(result).toBe(true);
  });

  test('can save document', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    const savedCat = await cat.save();
    expect(savedCat).toBeDefined();

    expect(savedCat.id).toBeDefined();
    expect(savedCat.name).toBe(cat.name);
    expect(savedCat.age).toBe(cat.age);
  });

  test('can get document', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    const savedCat = await cat.save();
    expect(savedCat).toBeDefined();

    const foundCat = await Cat.findOne<Cat>(savedCat.id);
    expect(foundCat).toBeDefined();
    expect(foundCat.id).toBe(savedCat.id);
    expect(foundCat.name).toBe(savedCat.name);
    expect(foundCat.age).toBe(savedCat.age);
  });

  test('can update document', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    const savedCat = await cat.save();
    expect(savedCat).toBeDefined();

    const foundCat = await Cat.findOne<Cat>(savedCat.id);
    expect(foundCat).toBeDefined();
    expect(foundCat.id).toBe(savedCat.id);
    expect(foundCat.name).toBe(savedCat.name);
    expect(foundCat.age).toBe(savedCat.age);

    const updatedCat = await savedCat.update({name: 'Mittens'});
    expect(updatedCat).toBeDefined();
    expect(updatedCat.id).toBe(savedCat.id);
    expect(updatedCat.name).toBe('Mittens');
    expect(updatedCat.age).toBe(savedCat.age);

    const foundUpdatedCat = await Cat.findOne<Cat>(savedCat.id);
    expect(foundUpdatedCat).toBeDefined();
    expect(foundUpdatedCat?.id).toBe(savedCat.id);
    expect(foundUpdatedCat?.name).toBe('Mittens');
    expect(foundUpdatedCat?.age).toBe(savedCat.age);
  });

  test('can delete document', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    const savedCat = await cat.save();
    expect(savedCat).toBeDefined();

    const foundCat = await Cat.findOne<Cat>(savedCat.id);
    expect(foundCat).toBeDefined();
    expect(foundCat?.id).toBe(savedCat.id);

    await savedCat.delete();

    const deletedCat = await Cat.findOne<Cat>(savedCat.id);
    expect(deletedCat).toBeUndefined();
  });

  test('can find by query', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    const savedCat = await cat.save();

    const foundCat = await Cat.findByQuery<Cat>({
      match: {
        name: savedCat.name,
      },
    });

    expect(foundCat).toBeDefined();
    expect(foundCat.length).toBe(1);
    expect(foundCat[0]?.id).toBe(savedCat.id);
    expect(foundCat[0]?.name).toBe(savedCat.name);
    expect(foundCat[0]?.age).toBe(savedCat.age);
  });

  test('can execute sql query', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    const savedCat = await cat.save();

    Cat.sql(`SELECT * FROM cats WHERE name = '${savedCat.name}'`).then(res => {
      expect(res).toBeDefined();
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.rows[0][0]).toBeDefined();
      expect(res.rows[0][2]).toBeDefined();
    });
  });

  test('can update by query', async () => {
    const cat = new Cat();
    cat.name = 'cytx';
    cat.age = faker.number.int({min: 1, max: 10});

    const savedCat = await cat.save();
    const foundCat = await Cat.findByQuery<Cat>({
      match: {
        name: savedCat.name,
      },
    });
    expect(foundCat).toBeDefined();

    await Cat.updateByQuery<Cat>(
      {
        match: {
          name: savedCat.name,
        },
      },
      {
        name: 'cytx2',
      }
    );

    const updatedCat = await Cat.findOne<Cat>(savedCat.id);

    expect(updatedCat).toBeDefined();

    expect(updatedCat?.id).toBe(savedCat.id);
    expect(updatedCat?.name).toBe('cytx2');
    expect(updatedCat?.age).toBe(savedCat.age);
  });

  test('find all', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    await cat.save();

    const foundCat = await Cat.findAll<Cat>();

    expect(foundCat).toBeDefined();
    expect(foundCat.length).toBeGreaterThan(0);
  });
  test('count', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});
    await cat.save();

    const count = await Cat.count();

    expect(count).toBeDefined();
    expect(count).toBeGreaterThan(0);
  });

  test('hook postSave', async () => {
    Cat.__Post_Save__Test = true;

    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});

    const savedCat = await cat.save();

    expect(savedCat.name).toBe('postSaveName');
  });

  test('hook preSave', async () => {
    Cat.__Pre_Save__Test = true;

    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});

    const savedCat = await cat.save();

    expect(savedCat.name).toBe('postSaveName');
  });

  test('ignores hooks that do not exist', async () => {
    const dog = new Dog();
    dog.name = faker.animal.dog();

    const savedDog = await dog.save();

    expect(savedDog.name).toBe(dog.name);
  });

  test('cannot save document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    const noSchema = new NoSchema();

    expect(noSchema.save()).rejects.toThrowError();
  });

  test('cannot update document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    const noSchema = new NoSchema();

    expect(noSchema.update({})).rejects.toThrowError();
  });

  test('cannot delete document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    const noSchema = new NoSchema();

    expect(noSchema.delete()).rejects.toThrowError();
  });

  test('cannot count document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}
    expect(NoSchema.count()).rejects.toThrowError();
  });
  test('cannot exists document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}
    expect(NoSchema.exists('FOO')).rejects.toThrowError();
  });

  test('cannot updateByQuery document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    expect(
      NoSchema.updateByQuery(
        {
          match: {
            name: 'cytx',
          },
        },
        {}
      )
    ).rejects.toThrowError();
  });

  test('cannot findByQuery document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    expect(NoSchema.findByQuery({})).rejects.toThrowError();
  });

  test('cannot sql document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    expect(NoSchema.sql('SELECT * FROM any')).rejects.toThrowError();
  });
  test('cannot find document whose schema does not exist', async () => {
    class NoSchema extends BaseSchema<NoSchema> {}

    expect(NoSchema.findOne('FOO')).rejects.toThrowError();

    expect(NoSchema.findAll()).rejects.toThrowError();
  });

  test('can determine if a document exists', async () => {
    const cat = new Cat();
    cat.name = faker.animal.cat();
    cat.age = faker.number.int({min: 1, max: 10});

    const savedCat = await cat.save();

    const exists = await Cat.exists(savedCat.id);

    expect(exists).toBe(true);
  });

  test('can determine if a document does not exist', async () => {
    const exists = await Cat.exists('FOO');
    expect(exists).toBe(false);
  });
  test('can clear metadata', async () => {
    TypeMetadataStorage.clear();

    const schema = TypeMetadataStorage.getSchema(Cat);
    expect(schema).toBeUndefined();

    const properties = TypeMetadataStorage.getPropertiesForTarget(Cat);
    expect(properties).toEqual([]);

    const mapping = TypeMetadataStorage.getMapping(Cat);
    expect(mapping).toEqual({properties: {}});
  });
});
