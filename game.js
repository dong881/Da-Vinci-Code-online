// Da Vinci Code Game Logic

class DaVinciGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.deck = {
            black: [],
            white: []
        };
        this.gameState = 'waiting'; // waiting, playing, finished
        this.lastAction = null;
    }

    // Initialize the game
    initGame(playerNames) {
        this.players = playerNames.map((name, index) => ({
            id: index,
            name: name,
            hand: [],
            eliminated: false
        }));

        // Create deck: black 0-11, white 0-11
        this.deck.black = [];
        this.deck.white = [];
        
        for (let i = 0; i <= 11; i++) {
            this.deck.black.push({ number: i, color: 'black', revealed: false });
            this.deck.white.push({ number: i, color: 'white', revealed: false });
        }

        // Shuffle decks
        this.shuffleDeck(this.deck.black);
        this.shuffleDeck(this.deck.white);

        // Deal initial tiles to each player (4 tiles each)
        for (let player of this.players) {
            for (let i = 0; i < 4; i++) {
                this.drawTileForPlayer(player);
            }
        }

        this.currentPlayerIndex = 0;
        this.gameState = 'playing';
        this.lastAction = { type: 'game_started' };
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    drawTileForPlayer(player) {
        // Randomly choose from black or white deck
        const availableColors = [];
        if (this.deck.black.length > 0) availableColors.push('black');
        if (this.deck.white.length > 0) availableColors.push('white');

        if (availableColors.length === 0) return null;

        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        const tile = this.deck[color].pop();
        
        if (tile) {
            player.hand.push(tile);
            this.sortPlayerHand(player);
            return tile;
        }
        return null;
    }

    sortPlayerHand(player) {
        // Sort by number, then by color (black before white)
        player.hand.sort((a, b) => {
            if (a.number !== b.number) {
                return a.number - b.number;
            }
            return a.color === 'black' ? -1 : 1;
        });
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getNextPlayer() {
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        let attempts = 0;
        
        // Find next non-eliminated player
        while (this.players[nextIndex].eliminated && attempts < this.players.length) {
            nextIndex = (nextIndex + 1) % this.players.length;
            attempts++;
        }
        
        return this.players[nextIndex];
    }

    nextTurn() {
        let attempts = 0;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        } while (this.players[this.currentPlayerIndex].eliminated && attempts < this.players.length);

        // Check if game is over
        const activePlayers = this.players.filter(p => !p.eliminated);
        if (activePlayers.length <= 1) {
            this.gameState = 'finished';
        }
    }

    // Process a guess
    processGuess(guessingPlayerId, targetPlayerId, tileIndex, guessedNumber) {
        const guessingPlayer = this.players.find(p => p.id === guessingPlayerId);
        const targetPlayer = this.players.find(p => p.id === targetPlayerId);

        if (!guessingPlayer || !targetPlayer) {
            return { success: false, error: 'Invalid player' };
        }

        if (guessingPlayer.id !== this.currentPlayerIndex) {
            return { success: false, error: 'Not your turn' };
        }

        if (targetPlayer.eliminated) {
            return { success: false, error: 'Target player is eliminated' };
        }

        if (tileIndex < 0 || tileIndex >= targetPlayer.hand.length) {
            return { success: false, error: 'Invalid tile index' };
        }

        const targetTile = targetPlayer.hand[tileIndex];

        if (targetTile.revealed) {
            return { success: false, error: 'Tile already revealed' };
        }

        const correct = targetTile.number === guessedNumber;

        if (correct) {
            // Correct guess - reveal target tile
            targetTile.revealed = true;
            
            // Check if target player is eliminated (all tiles revealed)
            const allRevealed = targetPlayer.hand.every(t => t.revealed);
            if (allRevealed) {
                targetPlayer.eliminated = true;
            }

            // Guessing player can draw a new tile
            const newTile = this.drawTileForPlayer(guessingPlayer);

            this.lastAction = {
                type: 'guess_correct',
                guessingPlayer: guessingPlayer.name,
                targetPlayer: targetPlayer.name,
                tile: { ...targetTile },
                guessedNumber,
                newTile: newTile ? { ...newTile } : null,
                targetEliminated: allRevealed
            };

            // Player gets another turn if guess was correct
            return { 
                success: true, 
                correct: true, 
                tile: targetTile,
                newTile: newTile,
                targetEliminated: allRevealed,
                continueTurn: true
            };
        } else {
            // Wrong guess - reveal one of guesser's tiles
            const unrevealedTiles = guessingPlayer.hand.filter(t => !t.revealed);
            
            if (unrevealedTiles.length > 0) {
                // Reveal the first unrevealed tile
                unrevealedTiles[0].revealed = true;

                // Check if guesser is eliminated
                const allRevealed = guessingPlayer.hand.every(t => t.revealed);
                if (allRevealed) {
                    guessingPlayer.eliminated = true;
                }

                this.lastAction = {
                    type: 'guess_wrong',
                    guessingPlayer: guessingPlayer.name,
                    targetPlayer: targetPlayer.name,
                    guessedNumber,
                    revealedTile: { ...unrevealedTiles[0] },
                    guesserEliminated: allRevealed
                };

                // Turn ends
                this.nextTurn();

                return { 
                    success: true, 
                    correct: false,
                    revealedTile: unrevealedTiles[0],
                    guesserEliminated: allRevealed,
                    continueTurn: false
                };
            }
        }

        return { success: false, error: 'Unexpected error' };
    }

    // Player chooses to draw without guessing (if they just drew on a correct guess)
    endTurn() {
        this.nextTurn();
        this.lastAction = { type: 'turn_ended', player: this.getCurrentPlayer().name };
    }

    getGameState() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                handSize: p.hand.length,
                hand: p.hand.map(t => ({ ...t })),
                eliminated: p.eliminated
            })),
            currentPlayerIndex: this.currentPlayerIndex,
            currentPlayer: this.getCurrentPlayer().name,
            gameState: this.gameState,
            deckCounts: {
                black: this.deck.black.length,
                white: this.deck.white.length
            },
            lastAction: this.lastAction
        };
    }

    // Get game state for a specific player (hide other players' unrevealed tiles)
    getGameStateForPlayer(playerId) {
        const state = this.getGameState();
        
        state.players = state.players.map(p => {
            if (p.id === playerId) {
                // Player can see their own tiles
                return p;
            } else {
                // Hide unrevealed tiles from other players
                return {
                    ...p,
                    hand: p.hand.map(t => 
                        t.revealed ? t : { color: t.color, revealed: false, hidden: true }
                    )
                };
            }
        });

        return state;
    }

    getWinner() {
        const activePlayers = this.players.filter(p => !p.eliminated);
        if (activePlayers.length === 1) {
            return activePlayers[0];
        }
        // If somehow multiple players remain, return the one with most unrevealed tiles
        if (activePlayers.length > 1) {
            return activePlayers.reduce((winner, player) => {
                const winnerUnrevealed = winner.hand.filter(t => !t.revealed).length;
                const playerUnrevealed = player.hand.filter(t => !t.revealed).length;
                return playerUnrevealed > winnerUnrevealed ? player : winner;
            });
        }
        return null;
    }

    getFinalStandings() {
        // Sort players by number of unrevealed tiles (descending)
        return [...this.players].sort((a, b) => {
            const aUnrevealed = a.hand.filter(t => !t.revealed).length;
            const bUnrevealed = b.hand.filter(t => !t.revealed).length;
            return bUnrevealed - aUnrevealed;
        });
    }
}

// Export for use in Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DaVinciGame;
}
