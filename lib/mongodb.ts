import { MongoClient, Db } from "mongodb";
import { DB_NAME } from "@/lib/db/collections";

// Verificar que la URI de MongoDB esté configurada
if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri: string = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
  retryWrites: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/** Punto único de acceso a la base de datos (DIP) */
export async function getDb(dbName: string = DB_NAME): Promise<Db> {
  const mongoClient = await clientPromise;
  return mongoClient.db(dbName);
}

/** @deprecated Usar getDb() */
export async function getDatabase(dbName: string = DB_NAME): Promise<Db> {
  return getDb(dbName);
}

export async function testConnection(): Promise<boolean> {
  try {
    const mongoClient = await clientPromise;
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connection successful");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    return false;
  }
}

export default clientPromise;