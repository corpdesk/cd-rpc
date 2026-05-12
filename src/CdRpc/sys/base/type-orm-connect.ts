import { DataSource } from 'typeorm';
import config from '../../../config';
import { Logging } from './winston.log';
import { inspect } from 'util';

const CONNECTION_NAME = process.env.DB_MS_CONN_NAME || 'default';

export const AppDataSource = new DataSource({
    name: CONNECTION_NAME,
    ...config.db, // Ensure this contains all required TypeORM options
    synchronize: false, // Set to true only in development
    migrationsRun: true, // Ensures migrations run automatically
});

export class TypeOrmDatasource {
    logger = new Logging();
    private dataSource: DataSource;

    constructor() {
        this.dataSource = AppDataSource;
    }

    async getConnection(): Promise<DataSource> {
        this.logger.logDebug("TypeOrmDatasource::getConnection()/01:");
        // this.logger.logDebug("TypeOrmDatasource::getConnection()/this.dataSource:", inspect(this.dataSource, { depth: 2 }));
        if (!this.dataSource.isInitialized) {
            this.logger.logDebug("TypeOrmDatasource::getConnection()/02:");
            await this.dataSource.initialize();
        }
        this.logger.logDebug("TypeOrmDatasource::getConnection()/03:");
        return this.dataSource;
    }

    handleError(e: any) {
        this.logger.logDebug("TypeOrmDatasource::handleError()/01:");
        console.error('Db::handleError()/e:', e);
    }
}