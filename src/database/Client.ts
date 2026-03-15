import Knex from "knex";
import { env } from "../utils/EnvManager.js";
import { DatabaseTables } from "../types/Database.types.js";

const DatabaseClient = Knex<DatabaseTables>({
  client: 'pg',
  connection: env.PG_CONNECTION_STRING,
});

export default DatabaseClient