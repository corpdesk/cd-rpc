import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import config from "../../../config";

export const MysqlDataSource = new DataSource(config.db2 as DataSourceOptions);

MysqlDataSource.initialize()
  .then(async () => {
    console.log("Connection initialized with database...");
  })
  .catch((error) => console.log(error));

export const getDataSource = (delay = 3000): Promise<DataSource> => {
  if (MysqlDataSource.isInitialized) return Promise.resolve(MysqlDataSource);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (MysqlDataSource.isInitialized) resolve(MysqlDataSource);
      else reject("Failed to create connection with database");
    }, delay);
  });
};
