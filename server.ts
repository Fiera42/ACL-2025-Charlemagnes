import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/adapters/http/routes/auth.js';
import calendarRoutes from './src/adapters/http/routes/calendar.js';
import {connectDatabase, closeDatabase} from './src/infrastructure/database/connection.js';
import {db} from './src/infrastructure/config/sqliteAdapter.js';
import {v4 as uuidv4} from 'uuid';
import bcrypt from 'bcryptjs';

dotenv.config();

async function bootstrap() {
    const app = express();
    const PORT: number = parseInt(process.env.PORT || '3000', 10);

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.get('/', (_req: Request, res: Response) => res.redirect('/index.html'));
    app.use('/auth', authRoutes);
    app.use('/calendar', calendarRoutes);

    // ⚠️ SUPPRIMER AVANT RENDU - Routes de test
    app.get('/test-db', (_req: Request, res: Response) => {
        try {
            const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
            const calendarCount = db.prepare('SELECT COUNT(*) as count FROM calendars').get() as { count: number };
            const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as {
                count: number
            };
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

            console.log('\n📊 Test base de données :');
            console.log(`- Utilisateurs : ${userCount.count}`);
            console.log(`- Calendriers : ${calendarCount.count}`);
            console.log(`- Rendez-vous : ${appointmentCount.count}`);
            console.log(`- Tables présentes :`, tables);

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
            const testUserId = uuidv4();
            const hashedPassword = await bcrypt.hash('test123', 10);

            const insertStmt = db.prepare(`
                            INSERT INTO users (id, email, password, username)
                            VALUES (?, ?, ?, ?)
                        `);
            insertStmt.run(testUserId, `test-${Date.now()}@example.com`, hashedPassword, `TestUser-${Date.now()}`);

            const user = db.prepare('SELECT id, email, username, created_at FROM users WHERE id = ?').get(testUserId);

            console.log('\n✓ Utilisateur test créé :', user);

            res.json({
                success: true,
                user: user,
                message: 'Utilisateur test créé et lu avec succès'
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

    app.use((_req: Request, res: Response) => {
        res.status(404).json({error: 'Route non trouvée'});
    });

    await connectDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✓ Serveur démarré sur le port ${PORT}`);
        console.log(`\n📋 Routes de test disponibles :`);
        console.log(`   http://localhost:${PORT}/test-db      - Statistiques DB`);
        console.log(`   http://localhost:${PORT}/test-insert  - Créer utilisateur test`);
        console.log(`   http://localhost:${PORT}/test-clean   - Nettoyer la DB\n`);
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