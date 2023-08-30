import {Global, Module, ModuleMetadata} from '@nestjs/common';

@Global()
@Module({})
export class ElastictypeCoreModule {
  static forRoot() {
    return <ModuleMetadata>{
      module: ElastictypeCoreModule,
      imports: [],
      providers: [],
    };
  }
}

export * from './elastictype.module';
