import { Request, Response } from 'express';
import db from '../database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { cpf, password } = req.body;

    if (!cpf || !password) {
      return res.status(400).json({ error: 'CPF and password are required' });
    }

    const existingUser = await db('users').where('cpf', cpf).first();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await db('users').insert({
      cpf,
      password: hashedPassword,
      email: `${cpf}@cpf.local`,
      name: 'Usuário',
      created_at: new Date(),
    }).returning('id');

    const userId = result.id || result;
    const token = generateToken(userId.toString());

    res.status(201).json({
      userId,
      token,
      user: { id: userId, cpf },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { cpf, password } = req.body;

    if (!cpf || !password) {
      return res.status(400).json({ error: 'CPF and password are required' });
    }

    // Remover formatação do CPF
    const cpfLimpo = cpf.replace(/[.\-]/g, '');

    // Buscar na tabela usuarios
    const user = await db('usuarios')
      .whereRaw("REPLACE(REPLACE(cpf_usuario, '.', ''), '-', '') = ?", [cpfLimpo])
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Detectar tipo de senha e validar
    function isBcryptHash(value: unknown): value is string {
      return typeof value === "string" && value.startsWith("$2");
    }

    const stored = user.senha as string | null | undefined;
    if (!stored) return res.status(401).json({ error: 'Invalid credentials' });

    let ok = false;

    if (isBcryptHash(stored)) {
      // Senha já é bcrypt
      ok = await comparePassword(password, stored);
    } else {
      // Senha em texto puro
      ok = password === stored;

      // Migrar automaticamente para bcrypt
      const autoMigrate = (process.env.AUTO_MIGRATE_PASSWORDS ?? "true") === "true";
      if (ok && autoMigrate) {
        const newHash = await hashPassword(password);
        await db("usuarios")
          .where("id_usuario", user.id_usuario)
          .update({ senha: newHash });
      }
    }

    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id_usuario.toString());

    res.json({
      userId: user.id_usuario,
      token,
      user: {
        id: user.id_usuario,
        cpf: user.cpf_usuario,
        name: user.nome_usuario,
        ibge: user.ibge,
        link_foto: user.link_foto,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    const user = await db('usuarios').where('id_usuario', userId).first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id_usuario,
      cpf: user.cpf_usuario,
      name: user.nome_usuario,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
