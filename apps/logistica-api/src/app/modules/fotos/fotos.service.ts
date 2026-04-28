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
    const [foto] = await this.knex('logistica_fotos_entrega')
      .insert({
        embarque_id: embarqueId,
        guia_id: guiaId,
        chofer_id: choferId,
        tipo,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        metadata: metadata ? JSON.stringify(metadata) : null,
        fecha_subida: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return foto;
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
    const [foto] = await this.knex('logistica_fotos_entrega')
      .insert({
        embarque_id: embarqueId,
        guia_id: guiaId,
        chofer_id: choferId,
        tipo,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        metadata: metadata ? JSON.stringify(metadata) : null,
        fecha_subida: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return foto;
  }

  async getFotosByEmbarque(embarqueId: string) {
    const fotos = await this.knex('logistica_fotos_entrega')
      .where('embarque_id', embarqueId)
      .orderBy('fecha_subida', 'asc');

    return fotos.map(f => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : null,
    }));
  }

  async getFotosByEmbarqueAndTipo(embarqueId: string, tipo: FotoTipo) {
    const fotos = await this.knex('logistica_fotos_entrega')
      .where({ embarque_id: embarqueId, tipo })
      .orderBy('fecha_subida', 'asc');

    return fotos.map(f => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : null,
    }));
  }

  async validarFotosRequeridas(embarqueId: string): Promise<{ valid: boolean; missing: FotoTipo[] }> {
    const requiredTypes: FotoTipo[] = ['entrega_firmada', 'ine_receptor'];
    const missing: FotoTipo[] = [];

    for (const tipo of requiredTypes) {
      const count = await this.knex('logistica_fotos_entrega')
        .where({ embarque_id: embarqueId, tipo })
        .count('id as count')
        .first();

      if (Number(count?.count || 0) === 0) {
        missing.push(tipo);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
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
