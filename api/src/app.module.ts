import 'dotenv/config';
import { APP_GUARD } from '@nestjs/core';
import { PublicApiGuard } from './common/gaurds/public-api.guard';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import helmet from 'helmet';
import cors from 'cors';
import { GraphqlModule } from './core/graphql/graphql.module';
import { DatabaseModule } from './core/database/database.module';
import { PaginationModule } from './common/pagination/pagination.module';

@Module({
  imports: [GraphqlModule, DatabaseModule, PaginationModule],
  providers: [{ provide: APP_GUARD, useClass: PublicApiGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(helmet(), cors()).forRoutes('*');
  }
}
