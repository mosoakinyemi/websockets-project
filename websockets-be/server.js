const webSocketServer = require("websocket").server;
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const webSocketsServerPort = 8000;

const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server,
});

const clients = {}; // all active connections in this object
const users = {}; //all active users in this object
let editorContent = null; //current editor content is maintained here.
let userActivity = []; //User activity history.

const brodacastMessage = (json) => {
  // We are sending the current data to all connected clients
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
};

const USER_EVENT = "userevent";
const CONTENT_CHANGE = "contentchange";
const UFT8 = "uft8";

wsServer.on("request", function (request) {
  var userID = uuidv4();
  console.log("New connection from origin " + request.origin);
  const connection = request.accept(null, request.origin); //accept request from all origins
  clients[userID] = connection;
  console.log(userID + " connected");
  connection.on("message", function (message) {
    if (message.type === "utf8") {
      const dataFromClient = JSON.parse(message.utf8Data);
      const json = { type: dataFromClient.type };
      if (dataFromClient.type === USER_EVENT) {
        users[userID] = dataFromClient;
        userActivity.push(
          `${dataFromClient.username} joined to edit the document`
        );
        json.data = { users, userActivity };
      } else if (dataFromClient.type === CONTENT_CHANGE) {
        editorContent = dataFromClient.content;
        json.data = { editorContent, userActivity };
      }
      brodacastMessage(JSON.stringify(json));
    }
  });
  // user disconnected
  connection.on("close", function (connection) {
    console.log(new Date() + " Peer " + userID + " disconnected.");
    const json = { type: USER_EVENT };
    userActivity.push(`${users[userID].username} left the document`);
    json.data = { users, userActivity };
    delete clients[userID];
    delete users[userID];
    brodacastMessage(JSON.stringify(json));
  });
});
