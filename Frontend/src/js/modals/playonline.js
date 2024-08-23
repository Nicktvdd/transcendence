import * as bootstrap from 'bootstrap';
import { startGame } from '../pong/pong';

const pongModalElement = document.getElementById('pongModal');
const waitingLobbyModalElement = document.getElementById('waitingLobbyModal');
const waitingLobbyModalLabel = document.getElementById('waitingLobbyModalLabel');
const lobbyContent = document.getElementById('lobbyContent');

// Initialize modals
const pongModal = new bootstrap.Modal(pongModalElement);
const waitingLobbyModal = new bootstrap.Modal(waitingLobbyModalElement);

// Function to open the waiting lobby
export function openWaitingLobby() {
    waitingLobbyModal.show();

    lobbyContent.innerHTML = 
    `<div class="d-flex justify-content-center">
        <div class="spinner-border" style="width: 4rem; height: 4rem;" role="status">
            <span class="visually-hidden">Waiting for players...</span>
        </div>
    </div>`;
    waitingLobbyModalLabel.textContent = "Waiting for players..";

    setTimeout(() => {
        connectToWebSockets();
    }, 1000);
}

function connectToWebSockets() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.token) {
        console.error('User data or token is missing');
        return;
    }

    const onlineStatusSocket = new WebSocket(`/ws/online/?token=${userData.token}`);

    let gameRoomSocket;

    onlineStatusSocket.onopen = function() {
        console.log('Connected to online status WebSocket');
    };

    onlineStatusSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'wait_for_opponent') {
            const roomName = data.room_name;
            connectToGameRoom(roomName);
        } else if (data.type === 'match_found') {
            const roomName = data.room_name;
            connectToGameRoom(roomName);
            lobbyContent.innerHTML = 
            `<div class="d-flex justify-content-center">
                <div class="spinner-border" style="width: 4rem; height: 4rem;" role="status">
                    <span class="visually-hidden">Match found! Connecting..</span>
                </div>
            </div>`;
            waitingLobbyModalLabel.textContent = "Match found! Connecting..";
        }
    };

    onlineStatusSocket.onclose = function(event) {
        console.log('Online status WebSocket closed:', event);
    };

    onlineStatusSocket.onerror = function(error) {
        console.error('Error in online status WebSocket:', error);
    };

    function connectToGameRoom(roomName) {
        gameRoomSocket = new WebSocket(`/ws/game/room/${roomName}/?token=${userData.token}`);

        gameRoomSocket.onopen = function() {
            console.log(`Connected to game room ${roomName} WebSocket`);
            gameRoomSocket.send(JSON.stringify({ type: 'join', username: userData.username }));
        };

        gameRoomSocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'starting_game') {
                lobbyContent.innerHTML = 
                `<div class="d-flex justify-content-center">
                    <div class="spinner-border" style="width: 4rem; height: 4rem;" role="status">
                        <span class="visually-hidden">Starting game..</span>
                    </div>
                </div>`;
                waitingLobbyModalLabel.textContent = "Starting game..";

                let config = {
                    isRemote: true,
                    gameId: data.message.game_id,
                    playerIds: [data.message.player1_id, data.message.player2_id],
                    player1Alias: data.message.player1_username,
                    player2Alias: data.message.player2_username,
                    isLocalTournament: false,
                };

                if (onlineStatusSocket.readyState === WebSocket.OPEN) {
                    onlineStatusSocket.close();
                }

                if (gameRoomSocket && gameRoomSocket.readyState === WebSocket.OPEN) {
                    gameRoomSocket.close();
                }

                pongModal.show();
                waitingLobbyModal.hide();
                startGame('pongGameContainer', config, handleGameEnd);
            }
        };

        gameRoomSocket.onclose = function(event) {
            console.log(`Game room ${roomName} WebSocket closed:`, event);
        };

        gameRoomSocket.onerror = function(error) {
            console.error(`Error in game room ${roomName} WebSocket:`, error);
        };
    }

    waitingLobbyModalElement.addEventListener('hide.bs.modal', function () {
        console.log('Modal is closing. Disconnecting WebSockets.');
        if (onlineStatusSocket.readyState === WebSocket.OPEN) {
            onlineStatusSocket.close();
        }

        if (gameRoomSocket && gameRoomSocket.readyState === WebSocket.OPEN) {
            gameRoomSocket.close();
        }
    });
}

function handleGameEnd(data) {
    pongModal.hide();
    waitingLobbyModal.show();
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.token) {
        console.error('User data or token is missing');
        return;
    }
    waitingLobbyModalLabel.textContent = "Game over";
    fetch(`/game-history/${data.game_id}/`)
        .then(response => response.json())
        .then(gameHistoryRecord => {
            lobbyContent.innerHTML = `<p>Final Score:</p>
            <p>${gameHistoryRecord.player1_username}: ${data.player1_score}</p>
            <p>${gameHistoryRecord.player2_username}: ${data.player2_score}</p>`;
            if (Number(userData.id) === data.winner) {
                updateGameHistory(data, gameHistoryRecord);
            }
        });
    setTimeout(() => {
        waitingLobbyModal.hide();
    }, 5000);
}

function updateGameHistory(data, gameHistoryRecord) {
    console.log('Updating game history record with winner_id:', data.winner);
    fetch(`/game-history/${data.game_id}/`)
        .then(response => response.json())
        .then(gameHistoryRecord => {
            if (gameHistoryRecord.winner_id === data.winner) {
                console.log(gameHistoryRecord);
                return;
            } else {
                gameHistoryRecord.winner_id = data.winner;
                return fetch(`/game-history/${data.game_id}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gameHistoryRecord)
                });
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const gameStatData = {
                game_id: data.game_id,
                player1_score: data.player1_score,
                player2_score: data.player2_score,
                total_hits: data.player1_hits + data.player2_hits,
                longest_rally: data.longest_rally
            };
            console.log('Creating game stat record:', gameStatData);
            return fetch('/game-stat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gameStatData)
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Game stat record created:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
