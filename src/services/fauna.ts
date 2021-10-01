import { Client } from "faunadb";

console.log(`KEY FAUNA -> ${process.env.FAUNA_DB_KEY}`)

export const fauna = new Client({
    secret: process.env.FAUNA_DB_KEY,
    domain: "db.us.fauna.com"
});