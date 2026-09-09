import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'heleonaire_dev_secret';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email e password são obrigatórios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password deve ter pelo menos 6 caracteres' });
      return;
    }

    const existing = await prisma.account.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existing) {
      res.status(409).json({ error: 'Username ou email já cadastrado' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const account = await prisma.account.create({
      data: { username, email, password: hashed }
    });

    const token = jwt.sign({ accountId: account.id, username: account.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, accountId: account.id, username: account.username });
  } catch (e: any) {
    console.error('[Auth] Register error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'username e password são obrigatórios' });
      return;
    }

    const account = await prisma.account.findUnique({ where: { username } });

    if (!account) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign({ accountId: account.id, username: account.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, accountId: account.id, username: account.username });
  } catch (e: any) {
    console.error('[Auth] Login error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
