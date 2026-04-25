import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../../shared/database/database.module';
import type { Knex } from 'knex';

@Injectable()
export class CostsService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findAll() {
    return this.knex('logistica_costos')
      .leftJoin('logistica_embarques', 'logistica_costos.embarque_id', 'logistica_embarques.id')
      .select('logistica_costos.*', 'logistica_embarques.folio as embarque_folio', 'logistica_embarques.fecha as embarque_fecha')
      .orderBy('logistica_costos.created_at', 'desc');
  }

  async findByEmbarque(embarqueId: string) {
    return this.knex('logistica_costos').where({ embarque_id: embarqueId }).first();
  }

  async create(data: any) {
    const existing = await this.knex('logistica_costos').where({ embarque_id: data.embarque_id }).first();
    if (existing) {
      throw new Error('Ya existen costos registrados para este embarque. Usa editar.');
    }

    const [costo] = await this.knex('logistica_costos').insert(data).returning('*');
    return costo;
  }

  async update(id: string, data: any) {
    const [costo] = await this.knex('logistica_costos')
      .where({ id })
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
      
    if (!costo) {
      throw new NotFoundException(`No se encontró el registro de costos con ID ${id}`);
    }
    return costo;
  }

  async remove(id: string) {
    const deleted = await this.knex('logistica_costos').where({ id }).del();
    if (!deleted) {
      throw new NotFoundException(`No se encontró el registro de costos con ID ${id}`);
    }
    return { success: true };
  }
}
