import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@megadulces/shared-auth/core';
import { RequirePermissions } from '@megadulces/shared-auth/core';
import { Permission } from '@megadulces/shared-auth/core';

@ApiTags('Fleet')
@Controller('fleet')
@UseGuards(JwtAuthGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Post()
  @RequirePermissions(Permission.LOG_UNIDADES_GESTIONAR)
  @ApiOperation({ summary: 'Registrar una nueva unidad' })
  create(@Body() data: any) {
    return this.fleetService.create(data);
  }

  @Get()
  @RequirePermissions(Permission.LOG_UNIDADES_VER)
  findAll() {
    return this.fleetService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.LOG_UNIDADES_VER)
  findOne(@Param('id') id: string) {
    return this.fleetService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.LOG_UNIDADES_GESTIONAR)
  update(@Param('id') id: string, @Body() data: any) {
    return this.fleetService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions(Permission.LOG_UNIDADES_GESTIONAR)
  remove(@Param('id') id: string) {
    return this.fleetService.remove(id);
  }
}
