import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../shared/database/database.module';
import { StaffModule } from './modules/staff/staff.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { ConfigModule as LogisticaConfigModule } from './modules/config/config.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { GuidesModule } from './modules/guides/guides.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CostsModule } from './modules/costs/costs.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    StaffModule,
    FleetModule,
    LogisticaConfigModule,
    ShipmentsModule,
    GuidesModule,
    ReportsModule,
    CostsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
