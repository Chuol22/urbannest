import pkg from "@prisma/client";

const { PrismaClient } = pkg;

const prisma = new PrismaClient(
    {log: 
    process.env.NODE_ENV === "development" ?["query", "info", "warn", "error"] : ["error"],
    });
    
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // Exit the process with an error code
  }
}

async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully");
  } catch (error) {
    console.error("Database disconnection failed:", error);
    process.exit(1); // Exit the process with an error code
  }
}

export { prisma, connectDB, disconnectDB };