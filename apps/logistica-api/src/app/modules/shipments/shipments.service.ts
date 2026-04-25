import { Injectable, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../../shared/database/database.module';
import type { Knex } from 'knex';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    return this.knex('logistica_embarques')
      .leftJoin('logistica_unidades', 'logistica_embarques.unidad_id', 'logistica_unidades.id')
      .leftJoin('logistica_colaboradores as operador', 'logistica_embarques.operador_id', 'operador.id')
      .select(
        'logistica_embarques.*',
        'logistica_unidades.placa as unidad_placa',
        'operador.nombre as operador_nombre'
      )
      .orderBy('fecha', 'desc');
  }

  async findOne(id: string) {
    const shipment = await this.knex('logistica_embarques')
      .leftJoin('logistica_colaboradores as operador', 'logistica_embarques.operador_id', 'operador.id')
      .where('logistica_embarques.id', id)
      .select(
        'logistica_embarques.*',
        'operador.nombre as operador_nombre'
      )
      .first();
    
    if (!shipment) return null;

    const costs = await this.knex('logistica_costos').where({ embarque_id: id }).first();
    const carga = await this.knex('logistica_detalles_carga').where({ embarque_id: id });
    const descarga = await this.knex('logistica_detalles_descarga').where({ embarque_id: id });
    const guias = await this.knex('logistica_guias').where({ embarque_id: id });

    return { ...shipment, costs, carga, descarga, guias };
  }

  async create(data: any) {
    return this.knex.transaction(async (trx) => {
      // 1. Extraer datos especiales que van a otras tablas o necesitan procesamiento
      const { 
        carga, 
        descargadores_regreso, 
        descargadores_lab, 
        costs,
        // Campos que necesitamos procesar o excluir de logistica_embarques
        costo_descarga,
        monto_lab,
        obs,
        ...rawShipmentData 
      } = data;
      
      // 2. Mapear y limpiar datos para la tabla principal 'logistica_embarques'
      const shipmentData = {
        folio: rawShipmentData.folio,
        fecha: rawShipmentData.fecha,
        unidad_id: rawShipmentData.unidad_id,
        operador_id: rawShipmentData.operador_id || null,
        origen: rawShipmentData.origen,
        destino_id: rawShipmentData.destino_id || null,
        destino_texto: rawShipmentData.destino_texto || rawShipmentData.destino || '',
        km: rawShipmentData.km || 0,
        flete: rawShipmentData.flete || 0,
        valor_carga: rawShipmentData.valor_carga || 0,
        cajas: rawShipmentData.cajas || 0,
        peso: rawShipmentData.peso || 0,
        tipo: rawShipmentData.tipo || 'entrega',
        estado: rawShipmentData.estado || 'programado',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // 3. Insertar Embarque
      const [shipment] = await trx('logistica_embarques')
        .insert(shipmentData)
        .returning('*');

      // 4. Insertar Costos Adicionales si existen
      if (costs) {
        await trx('logistica_costos').insert({ ...costs, embarque_id: shipment.id });
      }

      // 5. Insertar Detalles de Carga (Salida)
      if (carga && Array.isArray(carga) && carga.length > 0) {
        await trx('logistica_detalles_carga').insert(
          carga.map(c => ({
            embarque_id: shipment.id,
            colaborador_id: c.colaborador_id,
            tarifa: c.tarifa || 0,
            created_at: new Date(),
            updated_at: new Date()
          }))
        );
      }

      // 6. Insertar Detalles de Descarga (Regreso)
      if (descargadores_regreso && Array.isArray(descargadores_regreso) && descargadores_regreso.length > 0) {
        const montoPorPersona = (descargadores_regreso.length > 0) ? (costo_descarga / descargadores_regreso.length) : 0;
        await trx('logistica_detalles_descarga').insert(
          descargadores_regreso.map(d => ({
            embarque_id: shipment.id,
            colaborador_id: d.colaborador_id,
            monto: montoPorPersona,
            tipo: 'regreso',
            created_at: new Date(),
            updated_at: new Date()
          }))
        );
      }

      // 7. Insertar Detalles de Descarga (LAB)
      if (descargadores_lab && Array.isArray(descargadores_lab) && descargadores_lab.length > 0) {
        const montoPorPersonaLAB = (descargadores_lab.length > 0) ? (monto_lab / descargadores_lab.length) : 0;
        await trx('logistica_detalles_descarga').insert(
          descargadores_lab.map(d => ({
            embarque_id: shipment.id,
            colaborador_id: d.colaborador_id,
            monto: montoPorPersonaLAB,
            tipo: 'lab',
            created_at: new Date(),
            updated_at: new Date()
          }))
        );
      }

      return shipment;
    });
  }

  async getDashboardKPIs() {
    try {
      const stats = await this.knex('logistica_embarques')
        .select(
          this.knex.raw('count(*) as count'),
          this.knex.raw('COALESCE(sum(flete), 0) as total_flete'),
          this.knex.raw('COALESCE(sum(km), 0) as total_km')
        )
        .first();

      let opCostsTotal = 0;
      try {
        const opCosts = await this.knex('logistica_costos')
          .select(this.knex.raw('COALESCE(sum(total), 0) as total'))
          .first();
        opCostsTotal = parseFloat(opCosts?.total || 0);
      } catch (error) {
        opCostsTotal = 0;
      }

      let maniobraTotal = 0;
      try {
        const maniobraCosts = await this.knex('logistica_embarques')
          .select(this.knex.raw('COALESCE(sum(COALESCE(monto_carga,0) + COALESCE(monto_descarga,0) + COALESCE(monto_maniobra,0)), 0) as total'))
          .first();
        maniobraTotal = parseFloat(maniobraCosts?.total || 0);
      } catch (error) {
        maniobraTotal = 0;
      }

      const totalIngreso = parseFloat(stats?.total_flete || 0);
      const totalCosto = opCostsTotal + maniobraTotal;

      return {
        embarques: parseInt(stats?.count || 0),
        ingreso: totalIngreso,
        costo: totalCosto,
        km: parseInt(stats?.total_km || 0),
        margen: totalIngreso - totalCosto
      };
    } catch (error) {
      console.error('Error en getDashboardKPIs:', error);
      return {
        embarques: 0,
        ingreso: 0,
        costo: 0,
        km: 0,
        margen: 0
      };
    }
  }

  getStatuses() {
    return [
      { label: 'Programado', value: 'programado' },
      { label: 'En Tránsito', value: 'transito' },
      { label: 'Completado', value: 'completado' },
      { label: 'Cancelado', value: 'cancelado' }
    ];
  }
}
