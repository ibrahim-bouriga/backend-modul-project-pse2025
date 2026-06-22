/*
jeder Besucher erhält (ohne Login) eine eindeutige Identität mittels sessionId
middelware wird bei jedem Request vor der eigentlichen Route ausgeführt
*/


import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db.js';

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
    let sessionId = req.cookies?.session_id;

    //wenn keine sessionID, neue mir uuidv4 generieren
    if (!sessionId) {
        sessionId = uuidv4();

        //warte bis cart erstellt wurde
        await prisma.cart.create({
            data: {
                sessionId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        res.cookie('session_id', sessionId, {
            httpOnly: true, //kann nicht mit javascript gelesen werden
            sameSite: 'strict', //sendet cookies nur bei Request derselben webseite
            maxAge: 24 * 60 * 60 * 1000,
        });
    }

    (req as any).sessionId = sessionId;
    next();
}