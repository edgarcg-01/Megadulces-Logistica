import { Injectable, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../../shared/database/database.module';
import type { Knex } from 'knex';

@Injectable()
export class ConfigService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // --- Períodos ---
  async findAllPeriods() {
    return this.knex('logistica_periodos').select('*').orderBy('numero', 'asc');
  }

  async findCurrentPeriod() {
    const today = new Date().toISOString().split('T')[0];
    return this.knex('logistica_periodos')
      .where('inicio', '<=', today)
      .andWhere('fin', '>=', today)
      .first();
  }

  // --- Finanzas ---
  async findAllFinanzas() {
    return this.knex('logistica_config_finanzas').select('*');
  }

  async getFinanceValue(clave: string) {
    const row = await this.knex('logistica_config_finanzas').where({ clave }).first();
    return row ? parseFloat(row.valor) : 0;
  }

  async updateFinanceValue(clave: string, valor: number) {
    return this.knex('logistica_config_finanzas')
      .where({ clave })
      .update({ valor, updated_at: new Date() });
  }

  // --- Destinos ---
  async findAllDestinos() {
    return this.knex('logistica_catalogo_destinos').select('*').orderBy('nombre', 'asc');
  }

  async createDestino(data: any) {
    try {
      // Generate a unique nombre by appending a counter if needed
      const baseNombre = data.destino || 'NUEVO DESTINO';
      let nombre = baseNombre;
      let counter = 1;

      while (true) {
        try {
          const [result] = await this.knex('logistica_catalogo_destinos').insert({
            nombre: nombre,
            comision_chofer: data.comision_chofer || 0,
            comision_repartidor: data.comision_repartidor || 0,
            comision_ayudante: data.comision_ayudante || 0,
            km: data.km_referencia || 0
          }).returning('*');
          return result;
        } catch (insertError: any) {
          // Check if it's a unique constraint violation
          if (insertError.code === '23505' && insertError.constraint === 'logistica_catalogo_destinos_nombre_unique') {
            nombre = `${baseNombre} ${counter}`;
            counter++;
            continue;
          }
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error creating destino:', error);
      throw error;
    }
  }

  async updateDestino(id: string, data: any) {
    const [result] = await this.knex('logistica_catalogo_destinos')
      .where({ id })
      .update({
        nombre: data.destino,
        comision_chofer: data.comision_chofer,
        comision_repartidor: data.comision_repartidor,
        comision_ayudante: data.comision_ayudante,
        km: data.km_referencia,
        updated_at: new Date()
      })
      .returning('*');
    return result;
  }

  async deleteDestino(id: string) {
    return this.knex('logistica_catalogo_destinos').where({ id }).del();
  }
}
