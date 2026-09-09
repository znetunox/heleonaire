import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'heleonaire_dev_secret';
// Middleware: verifica JWT
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token não encontrado' });
        return;
    }
    try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
        req.accountId = decoded.accountId;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}
// GET /api/characters — lista personagens da conta
router.get('/', requireAuth, async (req, res) => {
    const accountId = req.accountId;
    const chars = await prisma.character.findMany({
        where: { accountId },
        select: {
            id: true,
            name: true,
            class: true,
            faction: true,
            level: true,
            mapId: true,
            availablePoints: true,
        },
        orderBy: { createdAt: 'asc' }
    });
    res.json(chars);
});
// POST /api/characters — cria personagem
router.post('/', requireAuth, async (req, res) => {
    const accountId = req.accountId;
    const { name, charClass, faction } = req.body;
    const validClasses = ['knight', 'assassin', 'archer', 'mage', 'cleric'];
    const validFactions = ['heleonaire', 'darkpact'];
    if (!name || !charClass || !faction) {
        res.status(400).json({ error: 'name, charClass e faction são obrigatórios' });
        return;
    }
    if (!validClasses.includes(charClass)) {
        res.status(400).json({ error: 'Classe inválida' });
        return;
    }
    if (!validFactions.includes(faction)) {
        res.status(400).json({ error: 'Facção inválida' });
        return;
    }
    const count = await prisma.character.count({ where: { accountId } });
    if (count >= 3) {
        res.status(400).json({ error: 'Máximo de 3 personagens por conta' });
        return;
    }
    const existing = await prisma.character.findUnique({ where: { name } });
    if (existing) {
        res.status(409).json({ error: 'Nome já está em uso' });
        return;
    }
    // Base stats por classe
    const baseStats = {
        knight: { str: 9, agi: 6, vit: 8, int: 3, dex: 5, luk: 4, maxHp: 150, maxMp: 30 },
        assassin: { str: 7, agi: 9, vit: 5, int: 4, dex: 7, luk: 8, maxHp: 100, maxMp: 40 },
        archer: { str: 6, agi: 8, vit: 5, int: 5, dex: 9, luk: 7, maxHp: 100, maxMp: 40 },
        mage: { str: 3, agi: 5, vit: 4, int: 9, dex: 7, luk: 7, maxHp: 80, maxMp: 120 },
        cleric: { str: 4, agi: 5, vit: 6, int: 8, dex: 6, luk: 6, maxHp: 90, maxMp: 100 },
    };
    const stats = baseStats[charClass];
    const character = await prisma.character.create({
        data: {
            accountId,
            name,
            class: charClass,
            faction,
            ...stats,
            hp: stats.maxHp,
            mp: stats.maxMp,
            availablePoints: 0,
        }
    });
    const serializedChar = {
        ...character,
        baseExp: character.baseExp.toString(),
        jobExp: character.jobExp.toString(),
        gold: character.gold.toString(),
        availablePoints: character.availablePoints.toString(),
    };
    res.json(serializedChar);
});
// GET /api/characters/:id — busca personagem
router.get('/:id', requireAuth, async (req, res) => {
    const accountId = req.accountId;
    const character = await prisma.character.findUnique({
        where: { id: req.params.id }
    });
    if (!character) {
        res.status(404).json({ error: 'Personagem não encontrado' });
        return;
    }
    const serializedChar = {
        ...character,
        baseExp: character.baseExp.toString(),
        jobExp: character.jobExp.toString(),
        gold: character.gold.toString(),
        availablePoints: character.availablePoints.toString(),
    };
    res.json(serializedChar);
});
// POST /api/characters/:id/stats/distribute — distribui pontos de atributo
router.post('/:id/stats/distribute', requireAuth, async (req, res) => {
    const accountId = req.accountId;
    const { str, agi, vit, int, dex, luk } = req.body;
    const character = await prisma.character.findUnique({
        where: { id: req.params.id }
    });
    if (!character) {
        res.status(404).json({ error: 'Personagem não encontrado' });
        return;
    }
    if (character.accountId !== accountId) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
    }
    // Validação dos pontos
    const pointsToDistribute = (str ?? 0) + (agi ?? 0) + (vit ?? 0) + (int ?? 0) + (dex ?? 0) + (luk ?? 0);
    if (pointsToDistribute > (character.availablePoints || 0)) {
        res.status(400).json({
            error: 'Pontos insuficientes',
            available: character.availablePoints,
            requested: pointsToDistribute
        });
        return;
    }
    // Atualiza atributos
    const updatedCharacter = await prisma.character.update({
        where: { id: character.id },
        data: {
            str: character.str + (str ?? 0),
            agi: character.agi + (agi ?? 0),
            vit: character.vit + (vit ?? 0),
            int: character.int + (int ?? 0),
            dex: character.dex + (dex ?? 0),
            luk: character.luk + (luk ?? 0),
            availablePoints: character.availablePoints - pointsToDistribute,
        },
    });
    res.json({
        message: 'Atributos distribuídos com sucesso',
        character: {
            ...updatedCharacter,
            availablePoints: updatedCharacter.availablePoints.toString(),
        }
    });
});
// DELETE /api/characters/:id — deleta personagem
router.delete('/:id', requireAuth, async (req, res) => {
    const accountId = req.accountId;
    const character = await prisma.character.findFirst({
        where: { id: req.params.id, accountId }
    });
    if (!character) {
        res.status(404).json({ error: 'Personagem não encontrado' });
        return;
    }
    await prisma.character.delete({ where: { id: req.params.id } });
    res.json({ message: 'Personagem deletado' });
});
export default router;
