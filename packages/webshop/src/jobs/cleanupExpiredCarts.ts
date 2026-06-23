import cron from 'node-cron';
import { prisma } from '../db.js';

export function startCartCleanupJob() {
    // Läuft alle 6 Stunden: 0 Uhr, 6 Uhr, 12 Uhr, 18 Uhr...
    cron.schedule('0 0,6,12,18 * * *', async () => {
        try {
            const result = await prisma.cart.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            });
            console.log(`[Cart Cleanup] ${result.count} abgelaufene Warenkörbe gelöscht.`);
        } catch (error) {
            console.error('[Cart Cleanup] Fehler beim Löschen abgelaufener Warenkörbe:', error);
        }
    });

    console.log('[Cart Cleanup] Job registriert — läuft alle 6 Stunden.');
}