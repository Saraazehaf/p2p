// Importer le module React
import React from "react";

// Importer le composant Chat depuis un fichier local
import Chat from "./Chat";

// Importer les consommateurs de contextes depuis App
import { ConnectionConsumer, ChannelConsumer } from "./App";

// Définition du composant fonctionnel Container
const Container = () => {
  return (
    // Utilisation de ConnectionConsumer pour accéder au contexte de connexion
    <ConnectionConsumer>
      {({ connection, updateConnection }) => (
        // Utilisation de ChannelConsumer pour accéder au contexte de canal
        <ChannelConsumer>
          {({ channel, updateChannel }) => (
            // Rendu du composant Chat avec les valeurs et fonctions de mise à jour des contextes
            <Chat
              // Passage de la connexion actuelle au composant Chat
              connection={connection}
              // Passage de la fonction de mise à jour de la connexion au composant Chat
              updateConnection={updateConnection}
              // Passage du canal actuel au composant Chat
              channel={channel}
              // Passage de la fonction de mise à jour du canal au composant Chat
              updateChannel={updateChannel}
            />
          )}
        </ChannelConsumer>
      )}
    </ConnectionConsumer>
  );
};

// Exporter le composant Container comme composant par défaut
export default Container;