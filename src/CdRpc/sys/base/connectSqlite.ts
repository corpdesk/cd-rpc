import config from '../../../config';
import {
    createConnection,
    ConnectionOptions,
    ConnectionManager,
    getConnectionManager,
    Connection
} from 'typeorm';

const CONNECTION_NAME = process.env.SQLITE_NAME;

export class ConnectSqlite {
    private connectionManager: ConnectionManager;
    connOptions = config.sqlite as unknown as ConnectionOptions;

    constructor() {
        this.connectionManager = getConnectionManager();
    }

    async getConnection(): Promise<Connection> {
        let connection: Connection;
        if (this.connectionManager.has(CONNECTION_NAME)) {
            connection = await this.connectionManager.get(CONNECTION_NAME);
            if (!connection.isConnected) {
                connection = await connection.connect();
            }
        } else {
            const connectionOptions: ConnectionOptions = this.connOptions;
            try {
                connection = await createConnection(connectionOptions);
            } catch (e: any) {
                this.handleError(e);
            }
        }
        return connection;
    }

    async setConnEntity(model){
        (this.connOptions.entities as any[]).push(model);
    }

    handleError(e){
        console.log('Db::handleError()/e:', e)
    }
}

