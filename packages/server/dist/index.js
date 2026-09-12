import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { WorldRoom } from "./rooms/WorldRoom";
import authRouter from './api/authRouter';
import characterRouter from './api/characterRouter';
import { MAP_DEFS } from "./maps/mapDefs";
const port = Number(process.env.PORT || 2567);
const app = express();
app.use(cors());
app.use(express.json());
// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/characters', characterRouter);
app.get('/', (_req, res) => {
    res.send('Heleonaire Colyseus Server is running!');
});
const gameServer = new Server({
    transport: new WebSocketTransport({
        server: createServer(app)
    })
});
Object.keys(MAP_DEFS).forEach((mapId) => {
    gameServer.define(mapId, WorldRoom);
});
gameServer.listen(port).then(() => {
    console.log(`[Heleonaire Server] Listening on http://localhost:${port}`);
    console.log(`[Heleonaire Server] Maps registered: ${Object.keys(MAP_DEFS).join(', ')}`);
});
