import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeesModule } from './employees/employees.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [EmployeesModule,AuthModule,  ConfigModule.forRoot({ isGlobal: true }),
     TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Clash4fun123!',
      database: 'employees_db',
      autoLoadEntities: true, // Automatically links your @Entity() classes
      synchronize: true,      // Automatically updates SQL tables based on entities (dev only)
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
