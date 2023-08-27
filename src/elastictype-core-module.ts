import { Global, Module } from "@nestjs/common";

@Global()
@Module({})
export class ElastictypeCoreModule {
  static forRoot() {
    return {
      module: ElastictypeCoreModule,
      imports: [],
      providers: [],
    };
  }
}

export * from "./elastictype.module";
