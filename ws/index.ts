import { WebSocketServer } from "ws";
import { UserManager } from "./src/UserManager";


const wss = new WebSocketServer({port: 8080});

wss.on("message", (ws) => {
    UserManager.getInstance().addUser(ws)
});