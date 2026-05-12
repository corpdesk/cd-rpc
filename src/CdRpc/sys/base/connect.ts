import config from '../../../config';
import {
    createConnection,
    getConnection,
    ConnectionOptions,
    ConnectionManager,
    getConnectionManager,
    Connection
} from 'typeorm';

const CONNECTION_NAME = process.env.DB_MS_CONN_NAME;

export class Database {
    // private connectionManager: ConnectionManager;
    // connOptions = config.db as ConnectionOptions;
    private connectionManager = getConnectionManager();
    private connOptions = config.db as ConnectionOptions;

    constructor() {
        this.connectionManager = getConnectionManager();
    }

    // async getConnection(): Promise<Connection> {
    //     let connection: Connection;
    //     if (this.connectionManager.has(CONNECTION_NAME)) {
    //         connection = await this.connectionManager.get(CONNECTION_NAME);
    //         if (!connection.isConnected) {
    //             connection = await connection.connect();
    //         }
    //     } else {
    //         const connectionOptions: ConnectionOptions = this.connOptions;
    //         // console.log(`Database:getConnection()/connectionOptions: ${JSON.stringify(connectionOptions)}`)
    //         try {
    //             connection = await createConnection(connectionOptions);
    //         } catch (e: any) {
    //             this.handleError(e);
    //         }
    //     }
    //     return connection;
    // }
    async getConnection(): Promise<Connection> {
        try {
            if (this.connectionManager.has(CONNECTION_NAME)) {
                const connection = this.connectionManager.get(CONNECTION_NAME);
                if (!connection.isConnected) {
                    await connection.connect();
                }
                return connection;
            } else {
                return await createConnection({ name: CONNECTION_NAME, ...this.connOptions });
            }
        } catch (e: any) {
            this.handleError(e);
            throw e; // Rethrow the error so the caller can handle it properly
        }
    }

    async setConnEntity(model){
        // await this.connOptions.entities.push(model);
    }

    handleError(e){
        console.log('Db::handleError()/e:', e)
    }
}

