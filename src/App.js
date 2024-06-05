import React, { useState, createContext } from "react";
import Container from "./Container";

// Création d'un contexte pour la connexion
const ConnectionContext = createContext({
  connection: null, // Valeur initiale de la connexion
  updateConnection: () => {} // Fonction par défaut pour mettre à jour la connexion
});

// Création d'un contexte pour le canal
const ChannelContext = createContext({
  channel: null, // Valeur initiale du canal
  updateChannel: () => {} // Fonction par défaut pour mettre à jour le canal
});

const App = () => {
  // Déclaration d'un état local pour la connexion
  const [connection, setConnection] = useState(null);
  
  // Déclaration d'un état local pour le canal
  const [channel, setChannel] = useState(null);

  // Fonction pour mettre à jour l'état de la connexion
  const updateConnection = conn => {
    setConnection(conn);
  };

  // Fonction pour mettre à jour l'état du canal
  const updateChannel = chn => {
    setChannel(chn);
  };

  return (
    // Fourniture du contexte de connexion avec ses valeurs et fonctions de mise à jour
    <ConnectionContext.Provider value={{ connection, updateConnection }}>
      {/* Fourniture du contexte de canal avec ses valeurs et fonctions de mise à jour */}
      <ChannelContext.Provider value={{ channel, updateChannel }}>
        {/* Composant conteneur */}
        <Container />
      </ChannelContext.Provider>
    </ConnectionContext.Provider>
  );
};

// Exportation des consommateurs de contextes pour pouvoir les utiliser dans d'autres composants
export const ConnectionConsumer = ConnectionContext.Consumer
export const ChannelConsumer = ChannelContext.Consumer

// Exportation du composant App comme composant par défaut
export default App;

