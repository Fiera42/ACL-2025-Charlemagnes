import {initDatabase as initSQLite, closeDatabase as closeSQLite} from '../config/sqliteAdapter.js';

export async function connectDatabase(): Promise<void> {
    try {
        console.log('🔌 Connexion à la base de données SQLite...\n');
        await initSQLite();
        console.log('✓ Base de données prête');
    } catch (error) {
        console.error('✗ Erreur de connexion SQLite:', error);
        process.exit(1);
    }
}

export async function closeDatabase(): Promise<void> {
    try {
        await closeSQLite();
    } catch (error) {
        console.error('✗ Erreur lors de la fermeture:', error);
    }
}