import { pool, initDatabase } from '../config/database';

export async function connectDatabase(): Promise<void> {
    try {
        console.log('🔌 Connexion à la base de données...\n');

        // Test de connexion
        const connection = await pool.getConnection();
        console.log('✓ Connexion MySQL établie');
        connection.release();

        // Initialisation des tables
        await initDatabase();
        console.log('✓ Base de données initialisée');

    } catch (error) {
        console.error('✗ Erreur de connexion MySQL:', error);
        process.exit(1);
    }
}

export async function closeDatabase(): Promise<void> {
    try {
        await pool.end();
        console.log('✓ Connexion MySQL fermée');
    } catch (error) {
        console.error('✗ Erreur lors de la fermeture:', error);
    }
}