// Da Vinci Code - Main Application

class DaVinciApp {
    constructor() {
        this.peer = null;
        this.peerId = null;
        this.isHost = false;
        this.roomId = null;
        this.connections = [];
        this.players = [];
        this.game = null;
        this.localPlayerId = null;
        this.localPlayerName = '';
        
        this.initializeUI();
    }

    initializeUI() {
        // Lobby screen
        document.getElementById('create-room-btn').addEventListener('click', () => this.createRoom());
        document.getElementById('join-room-btn').addEventListener('click', () => this.joinRoom());

        // Waiting room
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('leave-room-btn').addEventListener('click', () => this.leaveRoom());
        document.getElementById('copy-room-id').addEventListener('click', () => this.copyRoomId());

        // Game screen
        document.getElementById('exit-game-btn').addEventListener('click', () => this.exitGame());
        document.getElementById('confirm-guess-btn').addEventListener('click', () => this.confirmGuess());
        document.getElementById('cancel-guess-btn').addEventListener('click', () => this.cancelGuess());

        // Game over screen
        document.getElementById('back-to-lobby-btn').addEventListener('click', () => this.backToLobby());
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
    }

    createRoom() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput.value.trim();

        if (!playerName) {
            this.showStatus('請輸入你的名字', 'error');
            return;
        }

        this.localPlayerName = playerName;
        this.isHost = true;

        this.showStatus('正在創建房間...', 'info');

        // Initialize PeerJS
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.peerId = id;
            this.roomId = id; // Use full peer ID as room ID
            this.localPlayerId = 0;
            
            this.players = [{
                id: 0,
                name: this.localPlayerName,
                peerId: this.peerId,
                isHost: true
            }];

            this.showScreen('waiting-screen');
            document.getElementById('current-room-id').textContent = this.roomId;
            this.updatePlayersList();
        });

        this.peer.on('connection', (conn) => {
            this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.showStatus('連線錯誤: ' + err.type, 'error');
        });
    }

    joinRoom() {
        const nameInput = document.getElementById('player-name');
        const roomInput = document.getElementById('room-id-input');
        const playerName = nameInput.value.trim();
        const roomId = roomInput.value.trim(); // Don't uppercase - use exact peer ID

        if (!playerName) {
            this.showStatus('請輸入你的名字', 'error');
            return;
        }

        if (!roomId) {
            this.showStatus('請輸入房間 ID', 'error');
            return;
        }

        this.localPlayerName = playerName;
        this.isHost = false;
        this.roomId = roomId;

        this.showStatus('正在加入房間...', 'info');

        // Initialize PeerJS
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.peerId = id;
            
            // Connect to host using the full peer ID
            const conn = this.peer.connect(roomId);

            conn.on('open', () => {
                // Send join request
                conn.send({
                    type: 'join_request',
                    playerName: this.localPlayerName,
                    peerId: this.peerId
                });
            });

            conn.on('data', (data) => {
                this.handleMessage(data, conn);
            });

            conn.on('close', () => {
                this.showStatus('與房主的連線已斷開', 'error');
                this.backToLobby();
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
                this.showStatus('連線失敗', 'error');
            });

            this.connections.push(conn);
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.showStatus('連線錯誤: ' + err.type, 'error');
        });
    }

    handleIncomingConnection(conn) {
        conn.on('open', () => {
            console.log('New connection established');
        });

        conn.on('data', (data) => {
            this.handleMessage(data, conn);
        });

        conn.on('close', () => {
            // Remove player if they disconnect
            const playerIndex = this.players.findIndex(p => p.peerId === conn.peer);
            if (playerIndex !== -1) {
                const player = this.players[playerIndex];
                this.players.splice(playerIndex, 1);
                this.updatePlayersList();
                this.addGameMessage(`${player.name} 已離開房間`, 'error');
            }
            
            // Remove from connections
            const connIndex = this.connections.findIndex(c => c.peer === conn.peer);
            if (connIndex !== -1) {
                this.connections.splice(connIndex, 1);
            }
        });

        this.connections.push(conn);
    }

    handleMessage(data, conn) {
        console.log('Received message:', data);

        switch (data.type) {
            case 'join_request':
                if (this.isHost) {
                    // Add player to the room
                    const newPlayerId = this.players.length;
                    const newPlayer = {
                        id: newPlayerId,
                        name: data.playerName,
                        peerId: data.peerId,
                        isHost: false
                    };
                    this.players.push(newPlayer);
                    this.updatePlayersList();

                    // Send current room state to new player
                    conn.send({
                        type: 'join_accepted',
                        playerId: newPlayerId,
                        players: this.players,
                        roomId: this.roomId
                    });

                    // Notify all other players
                    this.broadcast({
                        type: 'player_joined',
                        player: newPlayer
                    }, conn.peer);
                }
                break;

            case 'join_accepted':
                this.localPlayerId = data.playerId;
                this.players = data.players;
                this.roomId = data.roomId;
                this.showScreen('waiting-screen');
                document.getElementById('current-room-id').textContent = this.roomId;
                this.updatePlayersList();
                break;

            case 'player_joined':
                this.players.push(data.player);
                this.updatePlayersList();
                this.addGameMessage(`${data.player.name} 加入了房間`, 'success');
                break;

            case 'game_start':
                this.startGameClient(data.gameState);
                break;

            case 'game_state_update':
                this.updateGameState(data.gameState);
                break;

            case 'guess_made':
                this.handleGuessResult(data);
                break;
        }
    }

    broadcast(message, excludePeerId = null) {
        this.connections.forEach(conn => {
            if (conn.peer !== excludePeerId && conn.open) {
                conn.send(message);
            }
        });
    }

    updatePlayersList() {
        const container = document.getElementById('players-waiting');
        container.innerHTML = '';

        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item' + (player.isHost ? ' host' : '');
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = player.name;
            playerDiv.appendChild(nameSpan);

            if (player.isHost) {
                const badge = document.createElement('span');
                badge.className = 'player-badge';
                badge.textContent = '房主';
                playerDiv.appendChild(badge);
            }

            container.appendChild(playerDiv);
        });

        // Update start button state
        const startBtn = document.getElementById('start-game-btn');
        if (this.isHost) {
            startBtn.disabled = this.players.length < 2;
        } else {
            startBtn.style.display = 'none';
        }
    }

    copyRoomId() {
        const roomId = document.getElementById('current-room-id').textContent;
        navigator.clipboard.writeText(roomId).then(() => {
            const btn = document.getElementById('copy-room-id');
            const originalText = btn.textContent;
            btn.textContent = '已複製!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    startGame() {
        if (!this.isHost || this.players.length < 2) {
            return;
        }

        // Initialize game
        this.game = new DaVinciGame();
        const playerNames = this.players.map(p => p.name);
        this.game.initGame(playerNames);

        // Broadcast game start to all players
        const gameState = this.game.getGameState();
        this.broadcast({
            type: 'game_start',
            gameState: gameState
        });

        // Start game for host
        this.startGameClient(gameState);
    }

    startGameClient(gameState) {
        if (!this.game) {
            this.game = new DaVinciGame();
        }
        
        // Restore game state
        this.game.players = gameState.players.map((p, index) => ({
            id: index,
            name: p.name,
            hand: p.hand,
            eliminated: p.eliminated
        }));
        this.game.currentPlayerIndex = gameState.currentPlayerIndex;
        this.game.gameState = gameState.gameState;
        this.game.deck.black = gameState.deckCounts.black;
        this.game.deck.white = gameState.deckCounts.white;

        this.showScreen('game-screen');
        this.renderGame();
    }

    renderGame() {
        const myGameState = this.game.getGameStateForPlayer(this.localPlayerId);
        
        // Render turn indicator
        const isMyTurn = myGameState.currentPlayerIndex === this.localPlayerId;
        const turnIndicator = document.getElementById('current-turn');
        turnIndicator.textContent = isMyTurn ? '你的回合' : `${myGameState.currentPlayer} 的回合`;
        turnIndicator.className = 'turn-indicator' + (isMyTurn ? ' active' : '');

        // Render deck counts
        document.getElementById('black-deck-count').textContent = myGameState.deckCounts.black;
        document.getElementById('white-deck-count').textContent = myGameState.deckCounts.white;

        // Render opponents
        this.renderOpponents(myGameState);

        // Render player's hand
        this.renderPlayerHand(myGameState);
    }

    renderOpponents(gameState) {
        const opponentsArea = document.getElementById('opponents-area');
        opponentsArea.innerHTML = '';

        gameState.players.forEach(player => {
            if (player.id === this.localPlayerId) return;

            const opponentDiv = document.createElement('div');
            opponentDiv.className = 'opponent' + (player.eliminated ? ' eliminated' : '');

            const header = document.createElement('div');
            header.className = 'opponent-header';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'opponent-name';
            nameSpan.textContent = player.name;
            header.appendChild(nameSpan);

            const statusSpan = document.createElement('span');
            statusSpan.className = 'opponent-status ' + (player.eliminated ? 'eliminated' : 'alive');
            statusSpan.textContent = player.eliminated ? '已淘汰' : '存活';
            header.appendChild(statusSpan);

            opponentDiv.appendChild(header);

            // Render hand
            const hand = document.createElement('div');
            hand.className = 'hand';

            player.hand.forEach((tile, index) => {
                const tileDiv = this.createTileElement(tile, player.id, index);
                hand.appendChild(tileDiv);
            });

            opponentDiv.appendChild(hand);
            opponentsArea.appendChild(opponentDiv);
        });
    }

    renderPlayerHand(gameState) {
        const handArea = document.getElementById('player-hand');
        handArea.innerHTML = '';

        const myPlayer = gameState.players.find(p => p.id === this.localPlayerId);
        if (!myPlayer) return;

        myPlayer.hand.forEach((tile, index) => {
            const tileDiv = this.createTileElement(tile, this.localPlayerId, index, true);
            handArea.appendChild(tileDiv);
        });
    }

    createTileElement(tile, playerId, tileIndex, isMyTile = false) {
        const tileDiv = document.createElement('div');
        
        if (tile.hidden && !isMyTile) {
            // Hidden tile for opponents
            tileDiv.className = `tile hidden ${tile.color}`;
        } else {
            tileDiv.className = `tile ${tile.color} ${tile.revealed ? 'revealed' : ''}`;
            
            const numberSpan = document.createElement('div');
            numberSpan.className = 'tile-number';
            numberSpan.textContent = tile.number;
            tileDiv.appendChild(numberSpan);

            // Add click handler for guessing
            if (!isMyTile && !tile.revealed && this.game.currentPlayerIndex === this.localPlayerId) {
                tileDiv.classList.add('selectable');
                tileDiv.addEventListener('click', () => {
                    this.selectTileForGuess(playerId, tileIndex, tile);
                });
            }
        }

        return tileDiv;
    }

    selectTileForGuess(playerId, tileIndex, tile) {
        this.selectedGuess = { playerId, tileIndex, tile };
        
        const modal = document.getElementById('guess-modal');
        const info = document.getElementById('selected-tile-info');
        info.textContent = `${tile.color === 'black' ? '黑色' : '白色'} 牌`;
        
        document.getElementById('guess-number').value = '';
        modal.classList.add('active');
    }

    confirmGuess() {
        const guessNumber = parseInt(document.getElementById('guess-number').value);
        
        if (isNaN(guessNumber) || guessNumber < 0 || guessNumber > 11) {
            alert('請輸入 0-11 的數字');
            return;
        }

        const { playerId, tileIndex } = this.selectedGuess;
        
        // Process guess
        const result = this.game.processGuess(this.localPlayerId, playerId, tileIndex, guessNumber);
        
        if (result.success) {
            if (result.correct) {
                this.addGameMessage(`你猜對了！該牌是 ${result.tile.number}`, 'success');
                if (result.targetEliminated) {
                    const targetPlayer = this.game.players.find(p => p.id === playerId);
                    this.addGameMessage(`${targetPlayer.name} 已被淘汰！`, 'success');
                }
            } else {
                this.addGameMessage(`猜錯了！你的 ${result.revealedTile.color === 'black' ? '黑色' : '白色'} ${result.revealedTile.number} 被翻開`, 'error');
                if (result.guesserEliminated) {
                    this.addGameMessage('你已被淘汰！', 'error');
                }
            }

            // Broadcast game state update
            if (this.isHost) {
                this.broadcast({
                    type: 'game_state_update',
                    gameState: this.game.getGameState()
                });
            }

            // Check if game is over
            if (this.game.gameState === 'finished') {
                this.showGameOver();
            } else {
                this.renderGame();
            }
        } else {
            this.addGameMessage('錯誤: ' + result.error, 'error');
        }

        this.cancelGuess();
    }

    cancelGuess() {
        document.getElementById('guess-modal').classList.remove('active');
        this.selectedGuess = null;
    }

    updateGameState(gameState) {
        // Update local game state
        this.game.players = gameState.players.map((p, index) => ({
            id: index,
            name: p.name,
            hand: p.hand,
            eliminated: p.eliminated
        }));
        this.game.currentPlayerIndex = gameState.currentPlayerIndex;
        this.game.gameState = gameState.gameState;

        if (this.game.gameState === 'finished') {
            this.showGameOver();
        } else {
            this.renderGame();
            
            // Show last action message
            if (gameState.lastAction) {
                this.displayLastAction(gameState.lastAction);
            }
        }
    }

    displayLastAction(action) {
        if (action.type === 'guess_correct') {
            this.addGameMessage(
                `${action.guessingPlayer} 猜對了 ${action.targetPlayer} 的牌 (${action.tile.number})`,
                'success'
            );
        } else if (action.type === 'guess_wrong') {
            this.addGameMessage(
                `${action.guessingPlayer} 猜錯了，自己的 ${action.revealedTile.number} 被翻開`,
                'error'
            );
        }
    }

    handleGuessResult(data) {
        this.updateGameState(data.gameState);
    }

    addGameMessage(message, type = '') {
        const messagesArea = document.getElementById('game-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'game-message ' + type;
        messageDiv.textContent = message;
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    showGameOver() {
        const winner = this.game.getWinner();
        const standings = this.game.getFinalStandings();

        const winnerDiv = document.getElementById('winner-announcement');
        winnerDiv.textContent = winner ? `🎉 ${winner.name} 獲勝！🎉` : '遊戲結束';

        const standingsDiv = document.getElementById('final-standings');
        standingsDiv.innerHTML = '<h3>最終排名</h3>';

        standings.forEach((player, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'standing-item';

            const rankSpan = document.createElement('span');
            rankSpan.className = 'standing-rank';
            rankSpan.textContent = `#${index + 1}`;
            itemDiv.appendChild(rankSpan);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'standing-name';
            nameSpan.textContent = player.name;
            itemDiv.appendChild(nameSpan);

            const tilesSpan = document.createElement('span');
            tilesSpan.className = 'standing-tiles';
            const unrevealed = player.hand.filter(t => !t.revealed).length;
            tilesSpan.textContent = `未翻開: ${unrevealed} 張`;
            itemDiv.appendChild(tilesSpan);

            standingsDiv.appendChild(itemDiv);
        });

        this.showScreen('gameover-screen');
    }

    leaveRoom() {
        this.cleanup();
        this.backToLobby();
    }

    exitGame() {
        if (confirm('確定要離開遊戲嗎？')) {
            this.cleanup();
            this.backToLobby();
        }
    }

    backToLobby() {
        this.cleanup();
        this.showScreen('lobby-screen');
        document.getElementById('player-name').value = this.localPlayerName;
    }

    cleanup() {
        // Close all connections
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.close();
            }
        });
        this.connections = [];

        // Destroy peer
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        // Reset state
        this.isHost = false;
        this.roomId = null;
        this.players = [];
        this.game = null;
        this.peerId = null;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DaVinciApp();
});
