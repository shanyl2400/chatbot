
var socket;
var sessionID;
export function connect() {
    return new Promise((resolve, reject) => {
        socket = new WebSocket('ws://localhost:8800/ws');
        socket.addEventListener('open', () => {
            resolve(socket);
        });

        socket.addEventListener('error', (error) => {
            reject(error);
        });
    });
}

export function createSession(onError) {
    let data = {
        "id": generateRandomId(),
        "type": 3000,
        "from": "user",
        "to": "aiServer",
        "data": null
    }

    sendWebSocketMessage(JSON.stringify(data), (message)=>{
        let resp = JSON.parse(message);
        console.log("session created:", resp.data.session_id);
        sessionID = resp.data.session_id;
        return true;
    }, (error)=>{
        console.log("create session failed:", error)
        onError(error); 
    });
}
export function closeSession(id) {
    let data = {
        "id": generateRandomId(),
        "type": 3002,
        "from": "user",
        "to": "aiServer",
        "data": {
            "session_id": id
        }
    }
    sendWebSocketMessage(JSON.stringify(data), (message)=>{
        console.log("session closed:", message)
        return true;
    }, (error)=>{
        console.log("close session failed:", error)
    });
}

export function chat(question, onText, onAudio, onError) {
    let requestID = generateRandomId();
    let data = {
        "id": generateRandomId(),
        "type": 3003,
        "from": "user",
        "to": "aiServer",
        "data": {
            "session_id": sessionID,
            "request_id": requestID,
            "question": question
        }
    }

    sendWebSocketMessage(JSON.stringify(data), (message)=>{
        let resp = JSON.parse(message);
        if(resp.type === 3004 && resp.data.request_id === requestID) {
            onText(requestID, resp.data.answer, resp.data.end);
        }else if (resp.type === 3008 && resp.data.request_id === requestID) {
            console.log("audio:", resp.data)
            onAudio(requestID, resp.data, resp.data.end);
        }
        return resp.data.end;
    }, (error)=>{
        console.log("chat failed:", error);
        onError(error);
    });
}


function sendWebSocketMessage(message, onMessage, onError) {
    const messageListener = (event) => {
        if(onMessage(event.data)) {
            socket.removeEventListener('message', messageListener);
            socket.removeEventListener('error', errorListener);
        }
    };

    const errorListener = (error) => {
        onError(error);
        socket.removeEventListener('error', errorListener);
        socket.removeEventListener('message', messageListener);
    };

    socket.addEventListener('message', messageListener);
    socket.addEventListener('error', errorListener);

    socket.send(message);
}

function generateRandomId() {
    const timestamp = Date.now().toString(); // 获取当前时间戳
    const randomNum = Math.random().toString().substring(2); // 生成随机数
    return timestamp + randomNum;
}
