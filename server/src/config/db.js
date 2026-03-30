import { PrismaClient } from"@prisma/client"

const prisma = new PrismaClient(
    {log: 
    process.env.NODE_ENV === "development" ?["query", "info", "warn", "error"] : ["error"],
    });
    
    
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("DB connected successfully");
    } catch (error) {
        console.error("DB connection failed", error);
        process.exit(1); // Exit the process with an error code
    }

    const disconnectDB = async () => {
        try {
        await prisma.$disconnect();
        console.log("DB disconnected successfully");
    } catch (error) {
        console.error("DB disconnection failed", error);
        process.exit(1); // Exit the process with an error code
    }
};};

export { connectDB, disconnectDB, prisma };