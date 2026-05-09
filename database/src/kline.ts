import { Client } from "pg";

const client = new Client({
    user: process.env.USER,
    host : process.env.HOST,
    port : parseInt(process.env.PORT || "5432"),
    database : process.env.DATABASE,
    password : process.env.PASSWORD
})

client.connect();

async function refreshViews() {
    await client.query("REFRESHED VIEW FOR VIEW klines_1m");
    await client.query("REFRESHED VIEW FOR VIEW klines_1h");
    await client.query("REFRESHED VIEW FOR VIEW klines_1w");

    console.log("Materialized view refreshed successfully")
}

refreshViews().catch(console.error);

setInterval(()=> {
    refreshViews()
}, 1000);


