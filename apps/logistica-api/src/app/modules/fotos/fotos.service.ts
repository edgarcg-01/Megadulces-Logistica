import { Injectable, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../../shared/database/database.module';
import type { Knex } from 'knex';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';

export type FotoTipo = 'entrega_firmada' | 'ine_receptor' | 'paquete' | 'daño' | 'general';

interface FotoMetadata {
  lat?: number;
  lng?: number;
  timestamp?: string;
  device?: string;
}

@Injectable()
export class FotosService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async subirFoto(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    embarqueId: string,
    guiaId: string,
    choferId: string,
    tipo: FotoTipo,
    metadata?: FotoMetadata,
  ) {
    // Subir a Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      `logistics/entregas/${embarqueId}`,
    );

    // Guardar en base de datos
    const now = new Date();
    const [foto] = await this.knex('logistica_fotos_entrega')
      .insert({
        embarque_id: embarqueId,
        guia_id: guiaId,
        chofer_id: choferId,
        tipo,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        metadata: metadata ? JSON.stringify(metadata) : null,
        fecha_subida: now,
        fecha_hora_subida: now, // Fecha y hora completas
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    return { ...foto, fecha_hora_subida: now };
  }

  async subirFotoBase64(
    base64Str: string,
    embarqueId: string,
    guiaId: string,
    choferId: string,
    tipo: FotoTipo,
    metadata?: FotoMetadata,
  ) {
    // Subir a Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImageBase64(
      base64Str,
      `logistics/entregas/${embarqueId}`,
    );

    // Guardar en base de datos
    const now = new Date();
    const [foto] = await this.knex('logistica_fotos_entrega')
      .insert({
        embarque_id: embarqueId,
        guia_id: guiaId,
        chofer_id: choferId,
        tipo,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        metadata: metadata ? JSON.stringify(metadata) : null,
        fecha_subida: now,
        fecha_hora_subida: now, // Fecha y hora completas
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    return { ...foto, fecha_hora_subida: now };
  }

  async getFotosByEmbarque(embarqueId: string) {
    try {
      console.log('Service: getFotosByEmbarque llamado con embarqueId:', embarqueId);

      // Verificar que la tabla existe y tiene las columnas necesarias
      const tableExists = await this.knex.schema.hasTable('logistica_fotos_entrega');
      if (!tableExists) {
        console.warn('Tabla logistica_fotos_entrega no existe');
        return [];
      }

      const hasTipo = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'tipo');
      const hasMetadata = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'metadata');

      console.log('Service: Columnas - tipo:', hasTipo, 'metadata:', hasMetadata);

      let query = this.knex('logistica_fotos_entrega')
        .where('embarque_id', embarqueId);

      console.log('Service: Query SQL:', query.toSQL());

      // Solo ordenar si la columna existe
      const hasFechaSubida = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'fecha_subida');
      if (hasFechaSubida) {
        query = query.orderBy('fecha_subida', 'asc');
      } else {
        query = query.orderBy('created_at', 'asc');
      }

      const fotos = await query;

      console.log('Service: Fotos encontradas:', fotos.length, fotos);

      return fotos.map(f => ({
        ...f,
        tipo: hasTipo ? f.tipo : 'general',
        // Knex ya parsea JSONB automáticamente, no necesitamos JSON.parse
        metadata: hasMetadata ? f.metadata : null,
      }));
    } catch (error: any) {
      console.error('Error en getFotosByEmbarque:', error);
      // En lugar de lanzar error, devolver array vacío
      return [];
    }
  }

  async getFotosByEmbarqueAndTipo(embarqueId: string, tipo: FotoTipo) {
    try {
      const tableExists = await this.knex.schema.hasTable('logistica_fotos_entrega');
      if (!tableExists) {
        return [];
      }

      const hasTipo = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'tipo');
      const hasMetadata = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'metadata');

      let query = this.knex('logistica_fotos_entrega')
        .where('embarque_id', embarqueId);

      if (hasTipo) {
        query = query.where('tipo', tipo);
      }

      const hasFechaSubida = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'fecha_subida');
      if (hasFechaSubida) {
        query = query.orderBy('fecha_subida', 'asc');
      } else {
        query = query.orderBy('created_at', 'asc');
      }

      const fotos = await query;

      return fotos.map(f => ({
        ...f,
        tipo: hasTipo ? f.tipo : 'general',
        // Knex ya parsea JSONB automáticamente, no necesitamos JSON.parse
        metadata: hasMetadata ? f.metadata : null,
      }));
    } catch (error: any) {
      console.error('Error en getFotosByEmbarqueAndTipo:', error);
      return [];
    }
  }

  async validarFotosRequeridas(embarqueId: string): Promise<{ valid: boolean; missing: FotoTipo[] }> {
    try {
      const tableExists = await this.knex.schema.hasTable('logistica_fotos_entrega');
      if (!tableExists) {
        return { valid: false, missing: ['entrega_firmada', 'ine_receptor'] };
      }

      const hasTipo = await this.knex.schema.hasColumn('logistica_fotos_entrega', 'tipo');
      const requiredTypes: FotoTipo[] = ['entrega_firmada', 'ine_receptor'];
      const missing: FotoTipo[] = [];

      for (const tipo of requiredTypes) {
        let query = this.knex('logistica_fotos_entrega')
          .where('embarque_id', embarqueId);

        if (hasTipo) {
          query = query.where('tipo', tipo);
        }

        const count = await query.count('id as count').first();

        if (Number(count?.count || 0) === 0) {
          missing.push(tipo);
        }
      }

      return {
        valid: missing.length === 0,
        missing,
      };
    } catch (error: any) {
      console.error('Error en validarFotosRequeridas:', error);
      return { valid: false, missing: ['entrega_firmada', 'ine_receptor'] };
    }
  }

  async deleteFoto(fotoId: string) {
    // Obtener la foto para saber el public_id
    const foto = await this.knex('logistica_fotos_entrega')
      .where('id', fotoId)
      .first();

    if (!foto) {
      throw new Error('Foto no encontrada');
    }

    // Eliminar de Cloudinary
    if (foto.public_id) {
      await this.cloudinaryService.deleteImage(foto.public_id);
    }

    // Eliminar de la base de datos
    await this.knex('logistica_fotos_entrega')
      .where('id', fotoId)
      .delete();

    return { success: true };
  }

  async getFotoById(fotoId: string) {
    const foto = await this.knex('logistica_fotos_entrega')
      .where('id', fotoId)
      .first();

    if (!foto) {
      return null;
    }

    return {
      ...foto,
      metadata: foto.metadata ? JSON.parse(foto.metadata) : null,
    };
  }
}
