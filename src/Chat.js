// importer les dépendances nécessaires
import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  Header,
  Icon,
  Input,
  Grid,
  Segment,
  Button,
  Loader
} from "semantic-ui-react";
import SweetAlert from "react-bootstrap-sweetalert";
import { format } from "date-fns";
import "./App.css";
import UsersList from "./UsersList";
import MessageBox from "./MessageBox";

// Use for remote connections
const configuration = {
  iceServers: [{ url: "stun:stun.1.google.com:19302" }]
};

// Définition du contenu de Chat
const Chat = ({ connection, updateConnection, channel, updateChannel }) => {
  // State management using hooks
  const [socketOpen, setSocketOpen] = useState(false); // Indicates if WebSocket conection is openn
  const [socketMessages, setSocketMessages] = useState([]); // Store incoming WebSocket messages
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Indicates if user is logged in
  const [name, setName] = useState(""); // Stocker les usernames
  const [loggingIn, setLoggingIn] = useState(false); // Indicates if login process is in progress
  const [users, setUsers] = useState([]); // Stores list of users
  const [connectedTo, setConnectedTo] = useState(""); // Stores name of user connected to
  const [connecting, setConnecting] = useState(false); // Indicates if connection process is in progress
  const [alert, setAlert] = useState(null); // Stores alert message
  const connectedRef = useRef(); // Reference to connected user
  const webSocket = useRef(null); // Reference to WebSocket connectio
  const [message, setMessage] = useState(""); // Storcke user's message
  const messagesRef = useRef({}); // Reference to messages
  const [messages, setMessages] = useState({}); // Stores messages
  const [file, setFile] = useState(null); // Stocke les fichiers à envoyer
  const [receivedFiles, setReceivedFiles] = useState({}); // Stocke les fichies received



  // Effect hook for WebSocket setup
  useEffect(() => {
    // Establishh WebSocket connection
    webSocket.current = new WebSocket("ws://10.3.24.183:9000");
    // Handle incoming messages
    webSocket.current.onmessage = message => {
      const data = JSON.parse(message.data);
      setSocketMessages(prev => [...prev, data]);
    };
    // Fermer WebSocket connection on component unmount
    webSocket.current.onclose = () => {
      webSocket.current.close();
    };
    // Cleanup function to close WebSocke connection
    return () => webSocket.current.close();
  }, []);


 // Effect hook to handle incoming socket messages
useEffect(() => {
  // Retrieve and process the latest message from the socketMessages array
  let data = socketMessages.pop();
  if (data) {
    // Vérifier le type du message and take appropriate action
    switch (data.type) {
      case "connect":
        // Set socketOpen state to true when connected
        setSocketOpen(true);
        break;
      case "login":
        // Handle login respons
        onLogin(data);
        break;
      case "updateUsers":
        // Actualiser la liste of users
        updateUsersList(data);
        break;
      case "removeUser":
        // Remove a user fro the list
        removeUser(data);
        break;
      case "offer":
        // Handle incoming offer for WebRTC connection
        onOffer(data);
        break;
      case "answer":
        // Handle incoming answer for WebRTC connectio
        onAnswer(data);
        break;
      case "candidate":
        // Handle incoming ICE candidate for WebRTC connection
        onCandidate(data);
        break;
      default:
        break;
    }
  }
}, [socketMessages]);




  // Fonction to close the alert dialog
  const closeAlert = () => {
    setAlert(null);
  };


  // Fonction to send data via WebSocket
  const send = data => {
    webSocket.current.send(JSON.stringify(data));
  };

  // Function to handle login process
  const handleLogin = () => {
    setLoggingIn(true);
    send({
      type: "login",
      name
    });
  };

  // Function pour actualiser la liste des utilisateurs
  const updateUsersList = ({ user }) => {
    setUsers(prev => [...prev, user]);
  };


  // Function pour supprimer un utilisateur from the list
  const removeUser = ({ user }) => {
    setUsers(prev => prev.filter(u => u.userName !== user.userName));
  };


  // Fonction to handle received data channel messages
  const handleDataChannelMessageReceived = ({ data }) => {
    try {
      // Parse received message
      const message = JSON.parse(data);
      if (message.type === 'file') {
        // Handle file message
        const { fileName, fileData } = message;
        setReceivedFiles(prev => ({
          ...prev,
          [fileName]: fileData
        }));
      } else {
        // Handle regular message
        const { name: user } = message;
        let messages = messagesRef.current;
        let userMessages = messages[user];
        if (userMessages) {
          userMessages = [...userMessages, message];
          let newMessages = Object.assign({}, messages, { [user]: userMessages });
          messagesRef.current = newMessages;
          setMessages(newMessages);
        } else {
          let newMessages = Object.assign({}, messages, { [user]: [message] });
          messagesRef.current = newMessages;
          setMessages(newMessages);
        }
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  };

  // Function to handle login response
  const onLogin = ({ success, message, users: loggedIn }) => {
    setLoggingIn(false);
    if (success) {
      // Display success message
      setAlert(
        <SweetAlert
          success
          title="Success!"
          onConfirm={closeAlert}
          onCancel={closeAlert}
        >
          Logged in successfully!
        </SweetAlert>
      );
      // Actualiser le statut des usitilisateurs et user list
      setIsLoggedIn(true);
      setUsers(loggedIn);
      // Create local RTCPeerConnection
      let localConnection = new RTCPeerConnection(configuration);
      // Handle ICE candidates
      //when the browser finds an ice candidate we send it to another peer
      localConnection.onicecandidate = ({ candidate }) => {
        let connectedTo = connectedRef.current;
        if (candidate && !!connectedTo) {
          send({
            name: connectedTo,
            type: "candidate",
            candidate
          });
        }
      };
      // Handle data channel creation
      localConnection.ondatachannel = event => {
        let receiveChannel = event.channel;
        receiveChannel.onopen = () => {
          console.log("Data channel is open and ready to be used.");
        };
        receiveChannel.onmessage = handleDataChannelMessageReceived;
        updateChannel(receiveChannel);
      };
      updateConnection(localConnection);
    } else {
      // Display un message d'erreuur
      setAlert(
        <SweetAlert
          warning
          confirmBtnBsStyle="danger"
          title="Failed"
          onConfirm={closeAlert}
          onCancel={closeAlert}
        >
          {message}
        </SweetAlert>
      );
    }
  };

 // Function to handle incoming offer for WebRTC connection
 //when somebody wants to message us
const onOffer = ({ offer, name }) => {
    // Définit l'état connectedTo sur le nom de l'utilisateur envoyant l'offre
    setConnectedTo(name);
    // Update connectedRef.current avec le nom de l'utilisateur
    connectedRef.current = name;
    // Définit la description distante de la connexion avec l'offre reçue
    connection
    .setRemoteDescription(new RTCSessionDescription(offer))
    // Create an answer to the offer
    .then(() => connection.createAnswer())
    // Set the local description of the connection with the created answer
    .then(answer => connection.setLocalDescription(answer))
    // Send the answer to the remote peer
    .then(() =>
      send({ type: "answer", answer: connection.localDescription, name })
    )
    // Catch any errors and display an error message
    .catch(e => {
      console.log({ e });
      setAlert(
        <SweetAlert
          warning
          confirmBtnBsStyle="danger"
          title="Failed"
          onConfirm={closeAlert}
          onCancel={closeAlert}
        >
          An error has occurred.
        </SweetAlert>
      );
    });
};


  // Function to handle incoming answer
  //when another user answers to our offer
  const onAnswer = ({ answer }) => {
    connection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // Function to handle incoming ICE candidate
  //when we got ice candidate from another user
  const onCandidate = ({ candidate }) => {
    connection.addIceCandidate(new RTCIceCandidate(candidate));
  };




// Fonction d'envoi d'un message
//when a user clicks the send message button

const sendMsg = () => {
  // Obtenir l'heure actuelle au format spécifié
  const time = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  // Créer l'objet texte à envoyer
  let text = { time, message, name };
  // Récupérer les messages actuels de l'utilisateur distant
  let messages = messagesRef.current;
  // Récupérer l'utilisateur connecté actuel
  let connectedTo = connectedRef.current;
  // Récupérer les messages de l'utilisateur connecté actuel
  let userMessages = messages[connectedTo];
  // Vérifier s'il existe des messages pour l'utilisateur connecté
  if (messages[connectedTo]) {
    // S'il existe des messages, les ajouter au tableau des messages
    userMessages = [...userMessages, text];
    // Update messages
    let newMessages = Object.assign({}, messages, {
      [connectedTo]: userMessages
    });
    // Mettre à jour les références de messages actuelles
    messagesRef.current = newMessages;
    // Mettre à jour les messages d'état avec les nouveaux messages
    setMessages(newMessages);
  } else {
    // S'il n'y a pas de messages, créer un nouveau tableau de messages pour l'utilisateur connecté
    userMessages = Object.assign({}, messages, { [connectedTo]: [text] });
    // Mettre à jour les références de messages actuelles
    messagesRef.current = userMessages;
    // Mettre à jour les messages d'état avec les nouveaux messages
    setMessages(userMessages);
  }
  // Send message to canal de communication
  channel.send(JSON.stringify(text));
  // Effacer le champ de message après l'envoi
  setMessage("");
};




// Fonction pour gérer la connexion
const handleConnection = name => {
  // Create a chanel for communication
  let dataChannel = connection.createDataChannel("messenger");
  // Gère les erreurs  dans le canal de données
  dataChannel.onerror = error => {
    // Affiche un message d'erreur en cas d'échec
    setAlert(
      <SweetAlert
        warning
        confirmBtnBsStyle="danger"
        title="Failed"
        onConfirm={closeAlert}
        onCancel={closeAlert}
      >
        Une erreur est survenue.
      </SweetAlert>
    );
  };
  // Écoute les messages entrants sur le canal de donnée
  dataChannel.onmessage = handleDataChannelMessageReceived;
  // Update canal de communication avec le new canal de donnée
  updateChannel(dataChannel);
  // Crée une offre pour établir une connexion WebRTC
  connection
    .createOffer()
    // Défini the local description  de l'offre créée
    .then(offer => connection.setLocalDescription(offer))
    // Envoie l'offre au pair distant
    .then(() =>
      send({ type: "offer", offer: connection.localDescription, name })
    )
    // Gèrerr les erreurs éventuelles
    .catch(e =>
      // Affiche un message d'erreur en cas d'échec
      setAlert(
        <SweetAlert
          warning
          confirmBtnBsStyle="danger"
          title="Failed"
          onConfirm={closeAlert}
          onCancel={closeAlert}
        >
          Une erreur est survenue.
        </SweetAlert>
      )
    );
};



  // Function to handle connection toggle
  const toggleConnection = userName => {
    if (connectedRef.current === userName) {
      setConnecting(true);
      setConnectedTo("");
      connectedRef.current = "";
      setConnecting(false);
    } else {
      setConnecting(true);
      setConnectedTo(userName);
      connectedRef.current = userName;
      handleConnection(userName);
      setConnecting(false);
    }
  };

  // Function to handle file input change
  const handleFileInputChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Function to send a file
  const sendFile = () => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target.result;
      const fileName = file.name;
      const fileMessage = {
        type: 'file',
        fileName,
        fileData,
        name
      };
      channel.send(JSON.stringify(fileMessage));
      setFile(null);
    };
    reader.readAsDataURL(file);
  };

  // JSX to render the chat UI
  // Représenter la structure JSX de l'interface de chat. 
  //Cette structure inclut l'en-tête de l'application, le formulaire de connexion, la liste des utilisateurs, la boîte de messages, le champ de téléchargement de fichier et les indicateurs de chargement. 
  // Display those components En fonction de l'état de connexion.
  return (
    <div className="App">
      {alert}
      <Header as="h2" icon>
        <Icon name="users" />
        Trust Talk App
      </Header>
      {(socketOpen && (
        <Fragment>
          <Grid centered columns={4}>
            <Grid.Column>
              {(!isLoggedIn && (
                <Input
                  fluid
                  disabled={loggingIn}
                  type="text"
                  onChange={e => setName(e.target.value)}
                  placeholder="Username..."
                  action
                >
                  <input />
                  <Button
                    color="purple"
                    disabled={!name || loggingIn}
                    onClick={handleLogin}
                  >
                    <Icon name="sign-in" />
                    Login
                  </Button>
                </Input>
              )) || (
                <Segment raised textAlign="center" color="purple">
                  Logged In as: {name}
                </Segment>
              )}
            </Grid.Column>
          </Grid>
          <Grid>
            <UsersList
              users={users}
              toggleConnection={toggleConnection}
              connectedTo={connectedTo}
              connection={connecting}
            />
            <MessageBox
              messages={messages}
              connectedTo={connectedTo}
              message={message}
              setMessage={setMessage}
              sendMsg={sendMsg}
              name={name}
              receivedFiles={receivedFiles} // Pass received files
            />
          </Grid>
          {isLoggedIn && (
            <Grid centered columns={4}>
              <Grid.Column>
                <Input type="file" onChange={handleFileInputChange} />
                <Button
                  color="purple"
                  disabled={!file}
                  onClick={sendFile}
                >
                  Send File
                </Button>
              </Grid.Column>
            </Grid>
          )}
        </Fragment>
      )) || (
        <Loader size="massive" active inline="centered">
          Loading
        </Loader>
      )}
    </div>
  );
};

export default Chat;
