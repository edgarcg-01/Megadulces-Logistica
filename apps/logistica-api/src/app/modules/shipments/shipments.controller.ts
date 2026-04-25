import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@megadulces/shared-auth/core';
import { RequirePermissions } from '@megadulces/shared-auth/core';
import { Permission } from '@megadulces/shared-auth/core';

@ApiTags('Shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @RequirePermissions(Permission.LOG_EMBARQUES_CREAR)
  @ApiOperation({ summary: 'Registrar un nuevo embarque' })
  create(@Body() data: any) {
    return this.shipmentsService.create(data);
  }

  @Get()
  @RequirePermissions(Permission.LOG_EMBARQUES_VER)
  findAll() {
    return this.shipmentsService.findAll();
  }

  @Get('dashboard')
  @RequirePermissions(Permission.LOG_EMBARQUES_VER)
  @ApiOperation({ summary: 'Obtener KPIs para el dashboard' })
  getDashboard() {
    return this.shipmentsService.getDashboardKPIs();
  }

  @Get('statuses')
  @RequirePermissions(Permission.LOG_EMBARQUES_VER)
  @ApiOperation({ summary: 'Obtener catálogo de estados de embarque' })
  getStatuses() {
    return this.shipmentsService.getStatuses();
  }

  @Get(':id')
  @RequirePermissions(Permission.LOG_EMBARQUES_VER)
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }
}
