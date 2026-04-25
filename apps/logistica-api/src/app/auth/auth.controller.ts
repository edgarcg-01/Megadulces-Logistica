import { Controller, Post, Body, UnauthorizedException, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../shared/database/database.module';
import type { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() credentials: { username: string; password: string }) {
    const { username, password } = credentials;

    // Buscar usuario en la base de datos
    const user = await this.knex('users')
      .where({ username })
      .first();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // Obtener permisos del rol
    const rolePermissions = await this.knex('role_permissions')
      .where({ role_name: user.role_name })
      .first();

    const permissions = rolePermissions?.permissions || {};

    // Generar JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role_name: user.role_name,
      permissions: permissions,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        role_name: user.role_name,
      },
    };
  }
}
