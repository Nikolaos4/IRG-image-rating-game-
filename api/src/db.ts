import { Pool } from "pg";

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "",
});

export default pool;

// async function runQuery() {
//     try {
//         // Connect to PostgreSQL
//         await client.connect();
//         console.log("Connected to database");

//         // Execute a query
//         const result = await client.query("SELECT NOW()");
//         console.log(result.rows);
//     } catch (err) {
//         console.error("Error executing query", err);
//     } finally {
//         // Close connection
//         await client.end();
//     }
// }

// runQuery();
