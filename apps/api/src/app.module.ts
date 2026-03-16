import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ImportsModule } from './modules/imports/imports.module';
import { BlogPostsModule } from './modules/blog-posts/blog-posts.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { LinksModule } from './modules/links/links.module';
import { FlightSearchModule } from './modules/flight-search/flight-search.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EmailModule } from './modules/email/email.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BrowserModule } from './modules/browser/browser.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'bloggpost'),
        password: config.get('DB_PASSWORD', 'bloggpost_dev'),
        database: config.get('DB_NAME', 'bloggpost'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BrowserModule,
    SuppliersModule,
    ImportsModule,
    BlogPostsModule,
    JobsModule,
    LinksModule,
    FlightSearchModule,
    ReportsModule,
    EmailModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
