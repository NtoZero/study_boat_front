import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { Pool } from "pg";
import { MongoClient } from "mongodb";

export async function POST(request: Request) {
  try {
    const config = await request.json();
    const {
      databaseType,
      host,
      port,
      databaseName,
      username,
      password,
      poolSize,
      options,
      useSSL,
    } = config;

    switch (databaseType) {
      case "mysql": {
        const connection = await mysql.createConnection({
          host,
          port: Number(port),
          user: username,
          password,
          database: databaseName,
          ssl: useSSL
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
          ...Object.fromEntries(
            options?.map((opt) => [opt.key, opt.value]) || []
          ),
        });

        try {
          await connection.connect();
          await connection.end();
        } catch (error) {
          console.error("MySQL connection error:", error);
          throw error;
        }
        break;
      }

      case "postgresql": {
        const pool = new Pool({
          host,
          port: Number(port),
          user: username,
          password,
          database: databaseName,
          ...Object.fromEntries(
            options?.map((opt) => [opt.key, opt.value]) || []
          ),
        });

        const client = await pool.connect();
        await client.release();
        await pool.end();
        break;
      }

      case "mongodb": {
        const url = `mongodb://${username}:${password}@${host}:${port}/${databaseName}`;
        const client = new MongoClient(url, {
          ...Object.fromEntries(
            options?.map((opt) => [opt.key, opt.value]) || []
          ),
        });

        await client.connect();
        await client.close();
        break;
      }

      default:
        throw new Error("Unsupported database type");
    }

    return NextResponse.json({ message: "Connection successful" });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Connection failed" },
      { status: 500 }
    );
  }
}
