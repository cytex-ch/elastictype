import {Module, Provider, Type} from '@nestjs/common';

import {Client} from '@elastic/elasticsearch';
import {BaseSchema, ElastictypeCoreModule, TypeMetadataStorage} from '.';
import {getIndexToken} from './decorators/inject-index.decorator';
import {IndexService} from './providers/index.service';

export function createElastictypeProviders(
  schemataConstructors: Type<BaseSchema<never>>[] = []
): Provider[] {
  return schemataConstructors.map(cl => ({
    useFactory: () => new IndexService(cl.name, cl),
    provide: getIndexToken(cl.name),
  }));
}
@Module({})
export class ElastictypeModule {
  static forRoot(options: {models: Type<BaseSchema<never>>[]; client: Client}) {
    const providers = createElastictypeProviders(options.models);

    TypeMetadataStorage.setClient(options.client);

    return {
      module: ElastictypeModule,
      imports: [ElastictypeCoreModule.forRoot()],
      providers: [
        ...providers,
        {
          provide: 'ELASTIC_CLIENT',
          useValue: options.client,
        },
      ],
      exports: [...providers],
    };
  }
}
