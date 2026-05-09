import { Client } from "pg";


const client = new Client({
    user: process.env.USER,
    host : process.env.HOST,
    port : parseInt(process.env.PORT || "5432"),
    database : process.env.DATABASE,
    password : process.env.PASSWORD
})

client.connect();

async function initializeDB(){
    await client.connect();

    await client.query(`
        DROP TABLE IF EXISTS "tata_prices";
        CREATE TABLE "tata_prices"(
        time      TIMESSTAMP WITH TIME ZONE NOT NULL,
        price     DOUBLE PRECISION,
        volume    DOUBLE PRECISON,
        currency_code   VARCHAR(10));
        SELECT create_hypertable("tata_prices", "time", "price", 2);
        `);

     await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.end();
    console.log("Database initialized successfully");
}

initializeDB().catch(console.error);
