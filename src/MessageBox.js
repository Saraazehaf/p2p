import React from 'react';
import { Segment, Comment, Button, Header, Icon, Grid, Card, Input, Sticky } from 'semantic-ui-react';
import { formatRelative } from 'date-fns';
import avatar from "./avatar.png";
const MessageBox = ({ messages, connectedTo, message, setMessage, sendMsg, name, receivedFiles }) => {
  const renderMessages = () => {
    if (!!connectedTo && messages[connectedTo]) {
      return messages[connectedTo].map(({ name: sender, message: text, time }) => (
        <Comment key={`msg-${name}-${time}`}>
        <Comment.Avatar src={avatar} />
        <Comment.Content>
          <Comment.Author>{sender === name ? 'You' : sender}</Comment.Author>
          <Comment.Metadata>
            <span>
              {formatRelative(new Date(time), new Date())}
            </span>
          </Comment.Metadata>
          <Comment.Text>{text}</Comment.Text>
        </Comment.Content>
      </Comment>
      ));
    } else {
      return (
        <Segment placeholder>
          <Header icon>
            <Icon name="discussions" />
            No messages available yet
          </Header>
        </Segment>
      );
    }
  };

  const renderReceivedFiles = () => {
    if (!connectedTo) return null;

    const userFiles = receivedFiles || {};
    return Object.entries(userFiles).map(([fileName, fileData], index) => (
      <Segment key={index}>
        <a href={fileData} download={fileName}>{fileName}</a>
      </Segment>
    ));
  };

  return (
    <Grid.Column width={11}>
      <Sticky>
        <Card fluid>
          <Card.Content
            header={
              !!connectedTo ? connectedTo : "Not chatting with anyone currently"
            }
          />
          <Card.Content>
            {renderMessages()}
            <Input
              fluid
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type message"
              action
            >
              <input />
              <Button color="purple" disabled={!message} onClick={sendMsg}>
                <Icon name="send" />
                Send Message
              </Button>
            </Input>
          </Card.Content>
          {renderReceivedFiles()}
        </Card>
      </Sticky>
    </Grid.Column>
  );
};

export default MessageBox;


