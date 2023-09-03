import "react-chat-elements/dist/main.css";
import './App.css';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState, useRef } from "react";
import { Navbar, Input, Button } from "react-chat-elements"
import MessageList from "./components/MessageList";
import { connect, createSession, chat } from "./api/ai";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function App() {
  let currentAudio = null;
  const audioMap = new Map();
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const [messageList, setMessageList] = useState([]);
  const [activeMessage, setActiveMessage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const { transcript } = useSpeechRecognition();

  useEffect(() => {
    //连接服务器
    connect().then(() => {
      createSession((err) => {
        toast.error("创建会话失败");
      });
    }).catch((err) => {
      console.log("connect failed, err:", err);
      toast.error("连接服务器失败");
    });

    const audioElement = audioRef.current;
    audioElement.addEventListener('ended', handleAudioEnded);
    return () => {
      audioElement.removeEventListener('ended', handleAudioEnded);
    };
  }, []);

  //音频播放完成
  const handleAudioEnded = () => {
    console.log('音频播放结束');
    // 在这里执行你想要的操作
    //播放下一条音频
    if (currentAudio) {
      let audio = audioMap.get(currentAudio.index + 1);
      if (audio) {
        console.log('播放下一条音频');
        currentAudio = {
          index: currentAudio.index + 1,
          src: audio.src,
          reqestID: audio.reqID,
        }
        playAudio();
      }
    }
  };

  const handleMicrophone = () => {
    if(isListening){
      SpeechRecognition.stopListening()
      inputRef.current.value += transcript;
    }else{
      SpeechRecognition.startListening({ language: 'zh-CN' })
    }
    setIsListening(!isListening);
  }

  const handleSend = () => {
    let inputValue = inputRef.current.value;
    inputRef.current.value = "";

    //clear active message
    setActiveMessage(null);
    messageList.push({
      username: "我",
      position: "right",
      text: inputValue,
    })
    setMessageList(messageList);
    setActiveMessage({
      username: "智慧树智能助手",
      position: "left",
      text: "正在思考中...",
      status: "waiting",
    });

    chat(inputValue, (reqID, message, end) => {
      if (!end) {
        setActiveMessage({
          requestID: reqID,
          username: "智慧树智能助手",
          position: "left",
          text: message,
        });
      } else {
        setActiveMessage(null);
        messageList.push({
          requestID: reqID,
          username: "智慧树智能助手",
          position: "left",
          text: message,
        })
        setMessageList(messageList);
      }
    }, (reqID, audio) => {
      if (!audioMap.has(reqID)) {
        audioMap.set(reqID, [audio]);
      } else {
        audioMap.get(reqID).push(audio);
      }
      if (audio.index === 1 || (currentAudio && audio.index === currentAudio.index + 1)) {
        currentAudio = {
          index: audio.index,
          src: audio.src,
          reqestID: reqID,
        }
        playAudio();
      }
    }, (error) => {
      toast.error("聊天失败");
    });
  }

  const playAudio = () => {
    if (currentAudio) {
      let audioElement = audioRef.current;
      audioElement.src = currentAudio.src;
      audioElement.play();
    }
  }
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  }

  return (
    <div className="App">
      <Navbar
        className="chat-navbar"
        left=<div style={{ "color": "#fff", "fontWeight": "bold" }}>智慧树智能助手</div>
        type="dark"
      />
      <div className="chat-list">
        <MessageList
          history={messageList}
          activeMessage={activeMessage}
        />
      </div>
      <div className="chat-input">
        <Input
          placeholder="请输入问题..."
          referance={inputRef}
          onKeyPress={handleKeyPress}
          maxHeight={100}
          rightButtons={
            <div>
              <Button
                text={isListening?"停止输入":"语音输入"}
                onClick={handleMicrophone}
              />
              <Button
                text={"发送"}
                onClick={handleSend}
                backgroundColor="#2B6CB0"
              />
            </div>

          }
        />
      </div>

      <audio ref={audioRef} />
      <Toaster />
    </div>
  );
}

export default App;
