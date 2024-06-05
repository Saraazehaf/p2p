// Importer les modules nécessaires de React et Semantic UI
import React from "react";
import { Grid, Segment, Card, List, Button, Image } from "semantic-ui-react";
import avatar from "./avatar.png"; // Importer l'image d'avatar

// Définir le composant UsersList en utilisant des props pour gérer les utilisateurs et l'état de connexion
const UsersList = ({ users, toggleConnection, connectedTo, connecting }) => {
  return (
    // Définir une colonne de grille qui occupe 5 largeurs de la grille
    <Grid.Column width={5}>
      {/* Définir une carte fluide pour afficher les utilisateurs en ligne */}
      <Card fluid>
        {/* Titre de la carte */}
        <Card.Content header="Utilisateurs en ligne" />
        
        {/* Contenu de la carte, aligné à gauche */}
        <Card.Content textAlign="left">
          {/* Vérifier si la liste des utilisateurs n'est pas vide */}
          {users.length ? (
            // Afficher la liste des utilisateurs en ligne
            <List divided verticalAlign="middle" size="large">
              {/* Mapper chaque utilisateur dans la liste pour créer un élément de liste */}
              {users.map(({ userName }) => (
                <List.Item key={userName}> {/* Utiliser userName comme clé unique pour chaque élément */}
                  
                  {/* Contenu flottant à droite, contenant le bouton de connexion/déconnexion */}
                  <List.Content floated="right">
                    <Button
                      onClick={() => {
                        // Appeler la fonction toggleConnection avec le nom de l'utilisateur lors du clic sur le bouton
                        toggleConnection(userName);
                      }}
                      // Désactiver le bouton si déjà connecté à un autre utilisateur
                      disabled={!!connectedTo && connectedTo !== userName}
                      // Afficher l'état de chargement si en cours de connexion
                      loading={connectedTo === userName && connecting}
                    >
                      {/* Changer le texte du bouton en fonction de l'état de connexion */}
                      {connectedTo === userName ? "Déconnecter" : "Connecter"}
                    </Button>
                  </List.Content>
                  
                  {/* Afficher l'avatar de l'utilisateur */}
                  <Image avatar src={avatar} />
                  
                  {/* Contenu principal de l'élément de liste, affichant le nom de l'utilisateur */}
                  <List.Content>
                    <List.Header>{userName}</List.Header>
                  </List.Content>
                </List.Item>
              ))}
            </List>
          ) : (
            // Si la liste des utilisateurs est vide, afficher un segment indiquant qu'il n'y a pas d'utilisateurs en ligne
            <Segment>Il n'y a pas d'utilisateurs en ligne</Segment>
          )}
        </Card.Content>
      </Card>
    </Grid.Column>
  );
};

// Exporter le composant UsersList pour pouvoir l'utiliser dans d'autres parties de l'application
export default UsersList;





