import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CostsService } from './costs.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@megadulces/shared-auth/core';
import { RequirePermissions } from '@megadulces/shared-auth/core';
import { Permission } from '@megadulces/shared-auth/core';

@ApiTags('Costs')
@Controller('logistics/costs')
@UseGuards(JwtAuthGuard)
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Get()
  findAll() {
    return this.costsService.findAll();
  }

  @Get('embarque/:id')
  findByEmbarque(@Param('id') id: string) {
    return this.costsService.findByEmbarque(id);
  }

  @Post()
  @RequirePermissions(Permission.LOG_EMBARQUES_CREAR)
  @ApiOperation({ summary: 'Registrar costos de un embarque' })
  create(@Body() createCostData: any) {
    return this.costsService.create(createCostData);
  }

  @Patch(':id')
  @RequirePermissions(Permission.LOG_EMBARQUES_CREAR)
  @ApiOperation({ summary: 'Actualizar costos de un embarque' })
  update(@Param('id') id: string, @Body() updateCostData: any) {
    return this.costsService.update(id, updateCostData);
  }

  @Delete(':id')
  @RequirePermissions(Permission.LOG_EMBARQUES_CREAR)
  remove(@Param('id') id: string) {
    return this.costsService.remove(id);
  }
}
