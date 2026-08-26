import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import { clerkMiddleware } from '@clerk/express'
import cors from 'cors';

import express from 'express';
import "dotenv/config";

import fs from 'fs';
import path from 'path';

import { connectDB } from './lib/db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDirPath = path.join(process.cwd(), 'public');

const CORS_OPTIONS = {
  origin: FRONTEND_URL,
  credentials: true
};
app.use(express.json());
app.use(cors(CORS_OPTIONS));
app.use(clerkMiddleware());


app.get("/health", (req, res) => {

  res.status(200).json({ message: "Server is healthy" });
});
if (fs.existsSync(publicDirPath)) {
  app.use(express.static(publicDirPath));

  app.get("/{*any}", (req, res, next) => {
    res.sendFile(path.join(publicDirPath, 'index.html'), (err) => next(err));
  });
}

app.listen(PORT, () => {
  connectDB(); // Call the connectDB function to establish a database connection
  console.log('Server is running on port:', PORT);
});