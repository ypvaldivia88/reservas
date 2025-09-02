import { MongoClient, Db } from "mongodb";

// Verificar que la URI de MongoDB esté configurada
if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri: string = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10, // Máximo número de conexiones en el pool
  serverSelectionTimeoutMS: 5000, // Timeout para selección de servidor
  socketTimeoutMS: 45000, // Timeout para operaciones de socket
  maxIdleTimeMS: 30000, // Tiempo máximo de conexiones inactivas
  retryWrites: true, // Reintentar operaciones de escritura en caso de fallo
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // En desarrollo, reutiliza el cliente para no abrir muchas conexiones
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, es mejor crear una nueva conexión
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Función helper para obtener la base de datos
export async function getDatabase(dbName: string = "nailsalon"): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// Función para probar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connection successful");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    return false;
  }
}

export default clientPromise;