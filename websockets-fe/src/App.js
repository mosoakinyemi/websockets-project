import React, { useRef, useEffect, useState } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Identicon from "react-identicons";
import { UncontrolledTooltip } from "reactstrap";
import Editor from "react-medium-editor";
import "medium-editor/dist/css/medium-editor.css";
import "medium-editor/dist/css/themes/default.css";
import "./App.css";

const LOCAL_HOST = "ws://127.0.0.1:8000";
const USER_EVENT = "userevent";
const CONTENT_CHANGE = "contentchange";

const client = new W3CWebSocket(LOCAL_HOST);

const defaultMessage = "Start writing your document here";

function App() {
  const [currentUsers, setCurretUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [userName, setUserName] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [text, setText] = useState("");

  const logInUser = () => {
    if (userName.trim()) {
      setUserName(userName);
      setIsLoggedIn(true);

      client.send(
        JSON.stringify({
          username: userName,
          type: USER_EVENT,
        })
      );
    }
  };

  //broacast the current editor changes to the server
  const onEditorStateChange = (text) => {
    console.log("new text", text);
    client.send(
      JSON.stringify({
        type: CONTENT_CHANGE,
        username: userName,
        content: text,
      })
    );
  };

  useEffect(() => {
    client.onopen = () => {
      console.log("WebSocket Client Connected!");
    };

    client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data);
      console.log("DATA from server", dataFromServer);
      if (dataFromServer.type === USER_EVENT) {
        setCurretUsers(Object.values(dataFromServer.data.users));
      } else if (dataFromServer.type === CONTENT_CHANGE) {
        setText(dataFromServer.data.editorContent || defaultMessage);
      }
      setUserActivity(dataFromServer.data.userActivity);
    };
  }, []);

  console.log(userActivity);
  console.log(currentUsers);

  const showLoginSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon
              className="account__avatar"
              size={64}
              string="randomness"
            />
            <p className="account__name">Hello, user!</p>
            <p className="account__sub">Join to edit the document</p>
          </div>
          <input
            name="username"
            onChange={(e) => setUserName(e.target.value)}
            className="form-control"
          />
          <button
            type="button"
            onClick={() => logInUser()}
            className="btn btn-primary account__btn"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );

  const showEditorSection = () => (
    <div className="main-content">
      <div className="document-holder">
        <div className="currentusers">
          {currentUsers.map((user) => (
            <React.Fragment>
              <span id={user.username} className="userInfo" key={user.username}>
                <Identicon
                  className="account__avatar"
                  style={{ backgroundColor: user.randomcolor }}
                  size={40}
                  string={user.username}
                />
              </span>
              <UncontrolledTooltip placement="top" target={user.username}>
                {user.username}
              </UncontrolledTooltip>
            </React.Fragment>
          ))}
        </div>
        <Editor
          options={{
            placeholder: {
              text: text ? defaultMessage : "",
            },
          }}
          className="body-editor"
          text={text}
          onChange={onEditorStateChange}
        />
      </div>
      <div className="history-holder">
        <ul>
          {userActivity.map((activity, index) => (
            <li key={`activity-${index}`}>{activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <div className="container-fluid">
        {isLoggedIn ? showEditorSection() : showLoginSection()}
      </div>
    </React.Fragment>
  );
}

export default App;
