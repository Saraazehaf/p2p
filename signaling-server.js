const express = require("express"); // Importer le module express
const WebSocket = require("ws"); // Importer le module ws pour WebSocket
const http = require("http"); // Importer le module http
const { v4: uuidv4 } = require('uuid'); // Importer le module uuid et renommer v4 en uuidv4
const app = express(); // Créer une application express

const port = process.env.PORT || 9000; // Définir le port sur 9000 ou utiliser celui défini dans les variables d'environnement

// Initialiser un serveur HTTP
const server = http.createServer(app);

// Initialiser une instance de serveur WebSocket
const wss = new WebSocket.Server({ server });

// Créer des objets pour stocker les utilisateurs et les salles
let users = {};
let rooms = {};

// Fonction utilitaire pour envoyer un message à un utilisateur
const sendTo = (connection, message) => {
  connection.send(JSON.stringify(message));
};

// Fonction utilitaire pour envoyer un message à tous les utilisateurs d'une salle
const sendToRoom = (roomName, message) => {
  const room = rooms[roomName];
  if (room) {
    room.forEach(clientName => {
      const client = users[clientName];
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
};

// Lorsque le serveur WebSocket reçoit une nouvelle connexion
wss.on("connection", ws => {
  console.log("Client connecté"); // Log quand un client se connecte

  ws.on("message", msg => {
    let data;
    // Accepter uniquement les messages JSON
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("JSON invalide");
      data = {};
    }
    const { type, name, offer, answer, candidate, room, message } = data;
    // Gérer le message selon son type
    switch (type) {
      // Quand un utilisateur tente de se connecter
      case "login":
        // Vérifier si le nom d'utilisateur est disponible
        if (users[name]) {
          sendTo(ws, {
            type: "login",
            success: false,
            message: "Nom d'utilisateur indisponible"
          });
        } else {
          const id = uuidv4();
          const loggedIn = Object.values(
            users
          ).map(({ id, name: userName }) => ({ id, userName }));
          users[name] = ws;
          ws.name = name;
          ws.id = id;
          ws.room = room;

          // Ajouter l'utilisateur à la salle
          if (!rooms[room]) {
            rooms[room] = [];
          }
          rooms[room].push(name);

          sendTo(ws, {
            type: "login",
            success: true,
            users: loggedIn
          });
          sendToRoom(room, {
            type: "updateUsers",
            user: { id, name }
          });
        }
        break;
      // Quand un utilisateur envoie une offre pour se connecter avec un autre utilisateur
      case "offer":
        // Vérifier si l'utilisateur destinataire existe
        const offerRecipient = users[name];
        if (!!offerRecipient) {
          sendTo(offerRecipient, {
            type: "offer",
            offer,
            name: ws.name
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `L'utilisateur ${name} n'existe pas !`
          });
        }
        break;
      // Quand un utilisateur envoie une réponse à une offre
      case "answer":
        // Vérifier si l'utilisateur destinataire existe
        const answerRecipient = users[name];
        if (!!answerRecipient) {
          sendTo(answerRecipient, {
            type: "answer",
            answer,
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `L'utilisateur ${name} n'existe pas !`
          });
        }
        break;
      // Quand un utilisateur envoie un candidat
      case "candidate":
        // Vérifier si l'utilisateur destinataire existe
        const candidateRecipient = users[name];
        if (!!candidateRecipient) {
          sendTo(candidateRecipient, {
            type: "candidate",
            candidate
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `L'utilisateur ${name} n'existe pas !`
          });
        }
        break;
      // Quand un utilisateur envoie un message
      case "message":
        sendToRoom(ws.room, {
          type: "message",
          message
        });
        break;
      // Quand un utilisateur quitte
      case "leave":
        // Notifier tous les utilisateurs que cet utilisateur a quitté
        sendToRoom(ws.room, "leave", { id: ws.id, name: ws.name });
        // Supprimer l'utilisateur de la liste
        delete users[ws.name];

        // Supprimer l'utilisateur de la salle
        rooms[ws.room] = rooms[ws.room].filter(userName => userName !== ws.name);
        if (rooms[ws.room].length === 0) {
          delete rooms[ws.room];
        }
        break;
      default:
        sendTo(ws, {
          type: "error",
          message: "Commande non trouvée : " + type
        });
        break;
    }
  });

  // Gérer la déconnexion du client
  ws.on("close", () => {
    console.log("Client déconnecté"); // Log quand un client se déconnecte

    // Notifier tous les utilisateurs que cet utilisateur a quitté
    if (ws.name) {
      sendToRoom(ws.room, {
        type: "leave",
        id: ws.id,
        name: ws.name
      });

      // Supprimer l'utilisateur de l'objet users
      delete users[ws.name];

      // Supprimer l'utilisateur de la salle
      if (rooms[ws.room]) {
        rooms[ws.room] = rooms[ws.room].filter(userName => userName !== ws.name);
        if (rooms[ws.room].length === 0) {
          delete rooms[ws.room];
        }
      }
    }
  });

  // Envoyer immédiatement un message de feedback à la connexion entrante
  ws.send(
    JSON.stringify({
      type: "connect",
      message: "Bonjour, je suis un serveur WebSocket"
    })
  );
});

// Démarrer notre serveur
server.listen(port, () => {
  console.log(`Serveur de signalisation fonctionnant sur le port : ${port}`);
});

