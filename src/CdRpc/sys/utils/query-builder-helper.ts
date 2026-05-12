import { SelectQueryBuilder, Repository, Like, Brackets } from "typeorm";
import { EntityAdapter } from "./entity-adapter";
import { IQueryWhere, IServiceInput, QueryInput } from "../base/i-base";
import { safeStringify } from "./safe-stringify";
import { Logging } from "../base/winston.log";

export class QueryBuilderHelper {
  logger: Logging;
  entityAdapter: EntityAdapter;

  constructor(private repository: Repository<any>) {
    this.logger = new Logging();
    this.entityAdapter = new EntityAdapter();
  }

  test(query, queryBuilder) {
    if (query.where && Array.isArray(query.where) && query.where.length > 0) {
      this.logger.logDebug("QueryBuilderHelper::createQueryBuilder/04:");
      query.where.forEach((condition, index) => {
        const key = Object.keys(condition)[0];
        this.logger.logDebug(
          `QueryBuilderHelper::createQueryBuilder/key:${key}`
        );
        const value = condition[key];
        this.logger.logDebug(
          "QueryBuilderHelper::createQueryBuilder/value:",
          value
        );
        this.logger.logDebug(
          "QueryBuilderHelper::createQueryBuilder/value._type:",
          value._type
        );

        const dbField = `${
          this.repository.metadata.name
        }.${this.getDatabaseColumnName(key)}`;

        if (value._type === "like") {
          let likeValue = value._value; // Extract the value inside Like()
          // Remove any extra quotes around the value
          if (likeValue.startsWith("'") && likeValue.endsWith("'")) {
            likeValue = likeValue.slice(1, -1);
          }
          queryBuilder.orWhere(`${dbField} LIKE :${key}`, { [key]: likeValue });
        } else {
          const operator = index === 0 ? "where" : "orWhere";
          queryBuilder[operator](`${dbField} = :${key}`, { [key]: value });
        }
      });
    } else if (
      query.where &&
      typeof query.where === "object" &&
      this.isEmptyObject(query.where)
    ) {
      this.logger.logDebug("QueryBuilderHelper::createQueryBuilder/05:");
      // Do not add any where clause
    }
  }

  transformWhereClause(where: any): any {
    this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/01");
    this.logger.logDebug(
      "QueryBuilderHelper::transformWhereClause()/where:",
      where
    );
    if (Array.isArray(where)) {
      this.logger.logDebug(
        "QueryBuilderHelper::transformWhereClause()/where:",
        where
      );
      this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/02");
      return where.map((condition) => {
        this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/03");
        this.logger.logDebug(
          "QueryBuilderHelper::transformWhereClause()/condition:",
          condition
        );
        const field = Object.keys(condition)[0];
        this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/04");
        const value = condition[field];
        this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/05");
        if (
          typeof value === "string" &&
          value.startsWith("Like(") &&
          value.endsWith(")")
        ) {
          this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/06");
          const match = value.match(/^Like\((.*)\)$/);
          this.logger.logDebug(
            `QueryBuilderHelper::transformWhereClause()/value:${value}`
          );
          this.logger.logDebug(
            `QueryBuilderHelper::transformWhereClause()/match:${match}`,
            
          );
          this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/07");
          if (match) {
            this.logger.logDebug(
              "QueryBuilderHelper::transformWhereClause()/08"
            );
            const param = match[1];
            this.logger.logDebug(
              `QueryBuilderHelper::transformWhereClause()/param:${param}`
            );
            const ret = { [field]: Like(param) };
            this.logger.logDebug(
              "QueryBuilderHelper::transformWhereClause()/ret:",
              ret
            );
            return ret;
          }
        }
        this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/09");
        return condition;
      });
    }
    this.logger.logDebug("QueryBuilderHelper::transformWhereClause()/10");
    return where;
  }

  transformQueryInput(query: QueryInput): QueryInput {
    const w = this.transformWhereClause(query.where);
    this.logger.logDebug("QueryBuilderHelper::transformQueryInput()/w:", w);
    return {
      ...query,
      where: w,
    };
  }

  async createQueryBuilder(
    serviceInput: IServiceInput<any>
  ): Promise<SelectQueryBuilder<any>> {
    this.logger.logDebug("QueryBuilderHelper::createQueryBuilder()/01");
    this.logger.logDebug(
      `QueryBuilderHelper::createQueryBuilder()/serviceInput.cmd?.query: ${JSON.stringify(
        serviceInput.cmd?.query
      )}`
    );
    const query = serviceInput.cmd?.query;
    const queryBuilder = this.repository.createQueryBuilder(
      this.repository.metadata.name
    );

    // Handling SELECT clause
    if (query.select && query.select.length > 0) {
      this.logger.logDebug("QueryBuilderHelper::createQueryBuilder()/02");
      this.entityAdapter.registerMappingFromEntity(serviceInput.serviceModel);
      const selectDB = await this.entityAdapter.getDbSelect(
        this.repository.metadata.name,
        query.select
      );
      queryBuilder.select(selectDB);
    } else {
      this.logger.logDebug("QueryBuilderHelper::createQueryBuilder()/03");
      // const allColumns = this.repository.metadata.columns.map(column => `${this.repository.metadata.name}.${column.databaseName}`);
      // queryBuilder.select(allColumns);
      const allColumns = this.repository.metadata.columns.map(
        (column) =>
          `\`${this.repository.metadata.name}\`.\`${column.databaseName}\``
      );
    }

    // Apply DISTINCT if specified
    if (query.distinct) {
      this.logger.logDebug("QueryBuilderHelper::createQueryBuilder()/03");
      queryBuilder.distinct(true);
    }

    // Handling WHERE clause
    if (query.where) {
      this.processSmartWhereClause(queryBuilder, query.where);
    }

    // Handling TAKE and SKIP clauses
    if (query.take) {
      queryBuilder.take(query.take);
    }

    if (query.skip) {
      queryBuilder.skip(query.skip);
    }

    return queryBuilder;
  }

  /**
     * Example of comparison usage
     * 
     * const query: IQuery = {
            update: {
                coopStatEnabled: true,
            },
            where: {
                'coopStatDate%BETWEEN': { start: '2024-01-01', end: '2024-06-30' },
            },
        };
        
     * const query: IQuery = {
            update: {
                coopStatDisplay: false,
            },
            where: {
                'coopStatDate%>': '2024-07-01',
                'cdGeoLocationId%=': 102,
            },
        };
     * @param queryBuilder 
     * @param where 
     */
  private processObjectWhereClause(
    queryBuilder: SelectQueryBuilder<any>,
    whereObject: any
  ) {
    this.logger.logDebug("QueryBuilderHelper::processObjectWhereClause()/01");
    const entries = Object.entries(whereObject);
    entries.forEach(([field, expr], index) => {
      const dbField = `${
        this.repository.metadata.name
      }.${this.getDatabaseColumnName(field)}`;
      this.logger.logDebug(
        `QueryBuilderHelper::processObjectWhereClause()/dbField:${dbField}`
      );
      if (index === 0) {
        queryBuilder.where(`${dbField} ${expr}`);
      } else {
        queryBuilder.andWhere(`${dbField} ${expr}`);
      }
    });
  }

  // Example SQL operator mapper
  private getSqlOperator(symbol: string): string {
    const operatorMap = {
      ">": ">",
      "<": "<",
      "=": "=",
      BETWEEN: "BETWEEN",
      LIKE: "LIKE",
    };
    return operatorMap[symbol] || "=";
  }

  processArrayWhereClause2(queryBuilder: SelectQueryBuilder<any>, where: any) {
    this.logger.logDebug("QueryBuilderHelper::processArrayWhereClause2/04:");
    this.logger.logDebug(
      "QueryBuilderHelper::processArrayWhereClause2/where:",
      where
    );
    let strWhere = JSON.stringify(where);
    this.logger.logDebug(
      `QueryBuilderHelper::processArrayWhereClause2/where1:${strWhere}`
    );
    const a = `:"Like\\(`; // Escape the '(' character
    const b = `')"}`;
    const regex = new RegExp(a, "g");
    strWhere = strWhere.replace(regex, b);
    this.logger.logDebug(
      `QueryBuilderHelper::processArrayWhereClause2/strWhere:${strWhere}`
    );
    where = JSON.parse(strWhere);
    this.logger.logDebug(
      "QueryBuilderHelper::processArrayWhereClause2/where2:",
      where
    );
    where.forEach((condition, index) => {
      const key = Object.keys(condition)[0];
      this.logger.logDebug(
        `QueryBuilderHelper::processArrayWhereClause2/key:${key}`
      );
      const value = condition[key];
      this.logger.logDebug(
        "QueryBuilderHelper::processArrayWhereClause2/value:",
        value
      );
      this.logger.logDebug(
        "QueryBuilderHelper::processArrayWhereClause2/value._type:",
        value._type
      );

      const dbField = `${
        this.repository.metadata.name
      }.${this.getDatabaseColumnName(key)}`;

      if (value._type === "like") {
        let likeValue = value._value; // Extract the value inside Like()
        this.logger.logDebug(
          "QueryBuilderHelper::processArrayWhereClause2/likeValue:",
          likeValue
        );
        // Remove any extra quotes around the value
        if (likeValue.startsWith("'") && likeValue.endsWith("'")) {
          likeValue = likeValue.slice(1, -1);
        }
        this.logger.logDebug(
          `QueryBuilderHelper::processArrayWhereClause2/${dbField} LIKE :${key}`
        );
        this.logger.logDebug(
          `QueryBuilderHelper::processArrayWhereClause2/{ [key]: likeValue }:{ [${key}]: ${likeValue} }`
        );
        queryBuilder.orWhere(`${dbField} LIKE :${key}`, { [key]: likeValue });
      } else {
        const operator = index === 0 ? "where" : "orWhere";
        queryBuilder[operator](`${dbField} = :${key}`, { [key]: value });
      }
    });
  }

  private processArrayWhereClause(
    queryBuilder: SelectQueryBuilder<any>,
    whereArray: Array<any>
  ) {
    this.logger.logDebug("QueryBuilderHelper::processArrayWhereClause()/01");
    whereArray.forEach((condition, index) => {
      const [field, expr] = Object.entries(condition)[0];
      const dbField = `${
        this.repository.metadata.name
      }.${this.getDatabaseColumnName(field)}`;
      this.logger.logDebug(
        `QueryBuilderHelper::processArrayWhereClause()/dbField:${dbField}`
      );
      if (index === 0) {
        queryBuilder.where(`${dbField} ${expr}`);
      } else {
        queryBuilder.orWhere(`${dbField} ${expr}`);
      }
    });
  }

  // private getDatabaseColumnName(field: string): string {
  //   const column = this.repository.metadata.findColumnWithPropertyName(field);
  //   return column ? column.databaseName : field;
  // }

  private getDatabaseColumnName(entityField: string): string {
    this.logger.logDebug(
      `QueryBuilderHelper::getDatabaseColumnName()/entityField:${entityField}`
    );
    const column = this.repository.metadata.columns.find(
      (col) => col.propertyName === entityField
    );
    // this.logger.logDebug('QueryBuilderHelper::getDatabaseColumnName()/column:', column)
    return column?.databaseName || entityField;
  }

  isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }

  addJSONSelect(jsonField: string, keys: string[]): this {
    const queryBuilder = this.repository.createQueryBuilder(
      this.repository.metadata.name
    );
    keys.forEach((key) => {
      queryBuilder.addSelect(
        `JSON_UNQUOTE(JSON_EXTRACT(${jsonField}, '$.${key}'))`,
        key
      );
    });
    return this;
  }

  updateJSONField(jsonField: string, updates: Record<string, any>): this {
    // Use UpdateQueryBuilder for updating
    const queryBuilder = this.repository
      .createQueryBuilder()
      .update(this.repository.metadata.name);

    // Construct the JSON_SET update expression
    const updateFields = Object.keys(updates)
      .map((key) => `JSON_SET(${jsonField}, '$.${key}', '${updates[key]}')`)
      .join(", ");

    // Use set() properly with UpdateQueryBuilder
    queryBuilder.set({ [jsonField]: () => updateFields });

    return this;
  }

  ///////////////////////////////////////////////////////////////////////////////

  /**
   * Extending capacity for andWhere and orWhere
   */

  private isObject(value: any): boolean {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isPlainWhereObject(where: any): boolean {
    return this.isObject(where) && !where.andWhere && !where.orWhere;
  }

  private processSmartWhereClause(
    queryBuilder: SelectQueryBuilder<any>,
    where: IQueryWhere | Array<{ [field: string]: string | number }>
  ) {
    this.logger.logDebug("QueryBuilderHelper::processSmartWhereClause()/01");
    this.logger.logDebug(
      `QueryBuilderHelper::processSmartWhereClause()/where:${JSON.stringify(
        where
      )}`
    );

    if (Array.isArray(where)) {
      this.logger.logDebug("QueryBuilderHelper::processSmartWhereClause()/02");
      this.processArrayWhereClause(queryBuilder, where); // OR logic
      this.logger.logDebug("QueryBuilderHelper::processSmartWhereClause()/03");
    } else if (this.isPlainWhereObject(where)) {
      this.logger.logDebug("QueryBuilderHelper::processSmartWhereClause()/04");
      this.processObjectWhereClause(queryBuilder, where); // AND logic
    } else {
      this.logger.logDebug("QueryBuilderHelper::processSmartWhereClause()/05");
      const typed = where as IQueryWhere;

      if (typed.andWhere && Array.isArray(typed.andWhere)) {
        this.logger.logDebug(
          "QueryBuilderHelper::processSmartWhereClause()/06"
        );
        queryBuilder.andWhere(
          new Brackets((qb) => {
            typed.andWhere!.forEach((c: any, i) => {
              if (c.orWhere) {
                qb[i === 0 ? "where" : "andWhere"](
                  new Brackets((subQb) => {
                    c.orWhere!.forEach((inner, j) => {
                      const [field, rawExpr] = Object.entries(inner)[0];
                      const normalizedExpr = this.normalizeExpr(rawExpr);
                      const dbField = `${
                        this.repository.metadata.name
                      }.${this.getDatabaseColumnName(field)}`;
                      if (j === 0) {
                        subQb.where(`${dbField} ${normalizedExpr}`);
                      } else {
                        subQb.orWhere(`${dbField} ${normalizedExpr}`);
                      }
                    });
                  })
                );
              } else {
                const [field, rawExpr] = Object.entries(c)[0];
                const normalizedExpr = this.normalizeExpr(rawExpr);
                const dbField = `${
                  this.repository.metadata.name
                }.${this.getDatabaseColumnName(field)}`;
                qb[i === 0 ? "where" : "andWhere"](
                  `${dbField} ${normalizedExpr}`
                );
              }
            });
          })
        );
      }

      if (typed.orWhere && Array.isArray(typed.orWhere)) {
        this.logger.logDebug(
          "QueryBuilderHelper::processSmartWhereClause()/11"
        );
        queryBuilder.andWhere(
          new Brackets((qb) => {
            typed.orWhere!.forEach((c, i) => {
              const [field, rawExpr] = Object.entries(c)[0];
              const normalizedExpr = this.normalizeExpr(rawExpr);
              const dbField = `${
                this.repository.metadata.name
              }.${this.getDatabaseColumnName(field)}`;
              if (i === 0) {
                qb.where(`${dbField} ${normalizedExpr}`);
              } else {
                qb.orWhere(`${dbField} ${normalizedExpr}`);
              }
            });
          })
        );
      }
    }
  }

  private normalizeExpr(expr: any): string {
    if (typeof expr === "number") return `= ${expr}`;
    if (/^(=|<|>|<=|>=|<>|LIKE|IN|IS|BETWEEN|NOT|LIKE|REGEXP)\s*/i.test(expr)) {
      return expr; // Already includes a valid SQL operator
    }
    if (/^\w+\(.*\)$/.test(expr)) {
      return expr; // Handles SQL functions like Like('%ka%')
    }
    if (!isNaN(Number(expr))) {
      return `= ${expr}`; // string but numeric-like
    }
    return `= '${expr}'`; // default fallback
  }
}
