import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
    ],
});
// Log all queries only in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
    });
}
// Always log errors
prisma.$on('error', (e) => {
    logger.error('🔥 Prisma Error:', e);
});
// Database connection function
export async function connectDatabase() {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected successfully');
    }
    catch (error) {
        logger.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
// Disconnect
export async function disconnectDatabase() {
    await prisma.$disconnect();
    logger.info('Database disconnected');
}
export default prisma;
//# sourceMappingURL=database.js.map