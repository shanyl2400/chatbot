
var socket;
var sessionID;
const API_URL = window.API_URL;

export function connect() {
    return new Promise((resolve, reject) => {
        socket = new WebSocket(`ws://${API_URL}/ws`);
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
        "data": null
    }

    sendWebSocketMessage(JSON.stringify(data), (message) => {
        let resp = JSON.parse(message);
        console.log("session created:", resp.data.session_id);
        sessionID = resp.data.session_id;
        return true;
    }, (error) => {
        console.log("create session failed:", error)
        onError(error);
    });
}
export function closeSession(id) {
    let data = {
        "id": generateRandomId(),
        "type": 3002,
        "data": {
            "session_id": id
        }
    }
    sendWebSocketMessage(JSON.stringify(data), (message) => {
        console.log("session closed:", message)
        return true;
    }, (error) => {
        console.log("close session failed:", error)
    });
}

export function chat(question, onText, onAudio, onError) {
    let requestID = generateRandomId();
    let data = {
        "id": generateRandomId(),
        "type": 3003,
        "data": {
            "session_id": sessionID,
            "request_id": requestID,
            "question": question
        }
    }

    let textEnd = false;
    let audioEnd = false;
    sendWebSocketMessage(JSON.stringify(data), (message) => {
        let resp = JSON.parse(message);
        if (resp.type === 3004 && resp.data.request_id === requestID) {
            onText(requestID, resp.data.answer, resp.data.end);
            if (resp.data.end) {
                textEnd = true;
            }
        } else if (resp.type === 3008 && resp.data.request_id === requestID) {
            if (resp.data.url) {
                onAudio(requestID, resp.data, resp.data.end);
            }
            if (resp.data.end) {
                audioEnd = true;
            }
        }

        // return textEnd && audioEnd;
        return false;
    }, (error) => {
        console.log("chat failed:", error);
        onError(error);
    });
    return requestID;
}


function sendWebSocketMessage(message, onMessage, onError) {
    const messageListener = (event) => {
        if (onMessage(event.data)) {
            console.log("remove event listener...")
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
