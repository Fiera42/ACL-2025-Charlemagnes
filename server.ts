import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/adapters/http/routes/api.js';
import { connectDatabase, closeDatabase } from './src/infrastructure/database/connection.js';
import { db } from './src/infrastructure/config/sqliteAdapter.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { ServiceFactory } from './src/adapters/factories/ServiceFactory.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
    const app = express();
    const PORT: number = parseInt(process.env.PORT || '3000', 10);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Monter toutes les routes API sous /api
    app.use('/api', apiRoutes);

    // ⚠️ SUPPRIMER AVANT RENDU - Routes de test
    app.get('/test-db', (_req: Request, res: Response) => {
        try {
            const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
            const calendarCount = db.prepare('SELECT COUNT(*) as count FROM calendars').get() as { count: number };
            const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as {
                count: number
            };
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            const sharesCount = db.prepare('SELECT COUNT(*) as count FROM shares').get() as { count: number };

            console.log('\n📊 Test base de données :');
            console.log(`- Utilisateurs : ${userCount.count}`);
            console.log(`- Calendriers : ${calendarCount.count}`);
            console.log(`- Rendez-vous : ${appointmentCount.count}`);
            console.log(`- Tables présentes :`, tables);
            console.log(`- Partages : ${sharesCount.count}`);

            res.json({
                success: true,
                stats: {
                    users: userCount.count,
                    calendars: calendarCount.count,
                    appointments: appointmentCount.count,
                    tables: tables
                },
                message: 'Base de données SQLite fonctionnelle ✓'
            });
        } catch (error: any) {
            console.error('❌ Erreur test DB:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.get('/test-insert', async (_req: Request, res: Response) => {
        try {
            const testUserId = '1';
            const hashedPassword = await bcrypt.hash('test123', 10);

            const insertStmt = db.prepare(`
                INSERT INTO users (id, email, password, username)
                VALUES (?, ?, ?, ?)
            `);
            insertStmt.run(testUserId, `test@example.com`, hashedPassword, `TestUser`);

            const user = db.prepare('SELECT id, email, username, created_at FROM users WHERE id = ?').get(testUserId);

            const testCalendarId = '1';
            const insertStmtCalendar = db.prepare(`
                INSERT INTO calendars (id, name, color, owner_id)
                VALUES (?, ?, ?, ?)
            `);
            insertStmtCalendar.run(testCalendarId, 'Calendrier Test', '#FF5733', testUserId);

            const testAppointmentId = '1';
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);

            const insertStmtAppointment = db.prepare(`
                INSERT INTO appointments (id, calendar_id, title, description, start_date, end_date, owner_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            insertStmtAppointment.run(
                testAppointmentId,
                testCalendarId,
                'Rendez-vous Test',
                'Rendez-vous créé automatiquement pour test',
                startDate.toISOString(),
                endDate.toISOString(),
                testUserId
            );

            console.log('\n✓ Utilisateur test créé :', user);
            console.log('✓ Calendrier test créé pour l\'utilisateur');
            console.log('✓ Rendez-vous test créé pour aujourd\'hui (10h00 - 11h00)');

            res.json({
                success: true,
                user: user,
                calendar: {
                    id: testCalendarId,
                    name: 'Calendrier Test',
                    color: '#FF5733'
                },
                appointment: {
                    id: testAppointmentId,
                    title: 'Rendez-vous Test',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    calendarId: testCalendarId,
                    ownerId: testUserId
                },
                message: 'Utilisateur, calendrier et rendez-vous test créés avec succès'
            });
        } catch (error: any) {
            console.error('❌ Erreur insertion:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.get('/test-clean', (_req: Request, res: Response) => {
        try {
            db.prepare('DELETE FROM appointments').run();
            db.prepare('DELETE FROM calendars').run();
            db.prepare('DELETE FROM shares').run();
            db.prepare('DELETE FROM users').run();

            console.log('\n🧹 Base de données nettoyée');

            res.json({
                success: true,
                message: 'Toutes les données ont été supprimées'
            });
        } catch (error: any) {
            console.error('❌ Erreur nettoyage:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // ⚠️ FIN DES ROUTES DE TEST

    // Servir les fichiers statiques de Vue (après build)
    app.use(express.static(path.join(__dirname, 'dist')));

    // Toutes les autres routes → index.html (pour Vue Router)
    // Express 5 ne supporte plus '*', on utilise une regex
    app.get(/^\/(?!api|test-).*/, (_req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    await connectDatabase();

    const calendarService = ServiceFactory.getCalendarService();
    const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 heure en ms

    const runUpdateJob = async () => {
        try {
            await calendarService.updateExternalCalendars();
        } catch (error) {
        } finally {
            setTimeout(runUpdateJob, UPDATE_INTERVAL);
        }
    };

    runUpdateJob();

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✓ Serveur démarré sur le port ${PORT}`);
        console.log(`\n📋 Routes API disponibles :`);
        console.log(`   http://localhost:${PORT}/api/auth/*`);
        console.log(`   http://localhost:${PORT}/api/calendar/*`);
        console.log(`\n📋 Routes de test disponibles :`);
        console.log(`   http://localhost:${PORT}/test-db      - Statistiques DB`);
        console.log(`   http://localhost:${PORT}/test-insert  - Créer utilisateur test`);
        console.log(`   http://localhost:${PORT}/test-clean   - Nettoyer la DB`);
        console.log(`\n🎨 Application Vue disponible sur http://localhost:${PORT}\n`);
    });

    const shutdown = async (signal: string) => {
        console.log(`\n${signal} reçu, arrêt en cours...`);
        await closeDatabase();
        server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
    console.error('Impossible de démarrer le serveur:', err);
    process.exit(1);
});