import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db.js';

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
    let sessionId = req.cookies?.session_id;

    if (!sessionId) {
        sessionId = uuidv4();

        await prisma.cart.create({
            data: {
                sessionId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        res.cookie('session_id', sessionId, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }

    (req as any).sessionId = sessionId;
    next();
}