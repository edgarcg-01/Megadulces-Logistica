import { Injectable, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../../shared/database/database.module';
import type { Knex } from 'knex';

@Injectable()
export class StaffService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findAll() {
    return this.knex('logistica_colaboradores').select('*').orderBy('nombre', 'asc');
  }

  async findOne(id: string) {
    return this.knex('logistica_colaboradores').where({ id }).first();
  }

  async create(data: Partial<any>) {
    const [result] = await this.knex('logistica_colaboradores').insert({
      ...data,
      roles: Array.isArray(data.roles) ? data.roles : [data.roles]
    }).returning('*');
    return result;
  }

  async update(id: string, data: Partial<any>) {
    const [result] = await this.knex('logistica_colaboradores')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    return result;
  }

  async remove(id: string) {
    return this.knex('logistica_colaboradores').where({ id }).del();
  }
}
