
import express from 'express';
import {config} from "dotenv/config"; 
import { connectDB, ConnectDB, disconnectDB } from './config/db.js';
const express = require('express');
const prisma = require('./config/prisma');

// import routes here 
import userRoutes from './routes/user.routes';

config();
connectDB

const app = express();
app.use(express.json());
// API routes
app.use('/users', userRoutes);

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


//handle unhandled promise rejections (e.g., database connection issues)
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    Server.close( async () => {
        await disconnectDB();
        process.exit(1);}// Exit the process with an error code
        );
    }
);

// Handle uncaught exceptions (e.g., programming errors)
process.on("uncaughtException", async (err) => {
    console.error("Uncaught Exception:", err);
    await disconnectDB();
    process.exit(1); // Exit the process with an error code
    }
);

// Handle graceful shutdown
process.on("unhandled Signal term", async () => {
    console.log("Signal recieved Shutting down gracefully...");
    Server.close( async () => {
    await disconnectDB();
    process.exit(0);
    });
    });




    
