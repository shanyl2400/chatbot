import { MessageBox } from "react-chat-elements";
function MessageList(props) {
    return (
      <div className="MessageList">
        {props.history.map((message, index) => {
          return <MessageBox 
            key={index}
            position={message.position}
            type="text"
            title={message.username}
            text={message.text}
          />
        })}

        {props.activeMessage && <MessageBox 
          position={props.activeMessage.position}
          type="text"
          title={props.activeMessage.username}
          text={props.activeMessage.text}
        />}
  
      </div>
    );
  }
  
export default MessageList;
