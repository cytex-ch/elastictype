import { Module, Provider, Type } from "@nestjs/common";

import { BaseSchemaInterface, ElastictypeCoreModule } from ".";
import { getIndexToken } from "./decorators/inject-index.decorator";
import { IndexService } from "./providers/index.service";
import { Client } from "@elastic/elasticsearch";

export function createElastictypeProviders(
  schemataConstructors: Type<BaseSchemaInterface>[] = []
): Provider[] {
  return schemataConstructors.map((cl) => ({
    useFactory: () => new IndexService(cl.name, cl),
    provide: getIndexToken(cl.name),
  }));
}
@Module({})
export class ElastictypeModule {
  static forRoot(options: {
    models: Type<BaseSchemaInterface>[];
    client: Client;
  }) {
    const providers = createElastictypeProviders(options.models);

    TypeMetadataStorage.setClient(options.client);

    return {
      module: ElastictypeModule,
      imports: [ElastictypeCoreModule.forRoot()],
      providers: [
        ...providers,
        {
          provide: "ELASTIC_CLIENT",
          useValue: options.client,
        },
      ],
      exports: [...providers],
    };
  }
}
