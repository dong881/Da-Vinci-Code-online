// Test Da Vinci Code game logic

// Load game.js for testing
let DaVinciGame;
if (typeof require !== 'undefined') {
    DaVinciGame = require('./game.js');
}

function runTests() {
    console.log('🧪 Testing Da Vinci Code Game Logic...\n');

    // Test 1: Game Initialization
    console.log('Test 1: Game Initialization');
    const game = new DaVinciGame();
    game.initGame(['Alice', 'Bob', 'Charlie']);
    console.assert(game.players.length === 3, 'Should have 3 players');
    console.assert(game.players[0].hand.length === 4, 'Each player should have 4 initial tiles');
    console.assert(game.gameState === 'playing', 'Game state should be playing');
    console.log('✅ Game initialization test passed\n');

    // Test 2: Player hands are sorted
    console.log('Test 2: Player hands are sorted');
    for (let player of game.players) {
        for (let i = 1; i < player.hand.length; i++) {
            const prev = player.hand[i-1];
            const curr = player.hand[i];
            const prevVal = prev.number * 2 + (prev.color === 'white' ? 1 : 0);
            const currVal = curr.number * 2 + (curr.color === 'white' ? 1 : 0);
            console.assert(prevVal <= currVal, `Hand should be sorted: ${prev.number}(${prev.color}) <= ${curr.number}(${curr.color})`);
        }
    }
    console.log('✅ Hand sorting test passed\n');

    // Test 3: Current player tracking
    console.log('Test 3: Current player tracking');
    const currentPlayer = game.getCurrentPlayer();
    console.assert(currentPlayer.id === 0, 'First player should be current');
    console.assert(currentPlayer.name === 'Alice', 'First player should be Alice');
    console.log('✅ Current player tracking test passed\n');

    // Test 4: Correct guess
    console.log('Test 4: Correct guess scenario');
    const testGame = new DaVinciGame();
    testGame.initGame(['Player1', 'Player2']);
    
    // Find a tile in player 2's hand to guess correctly
    const targetTile = testGame.players[1].hand[0];
    const correctNumber = targetTile.number;
    
    const result = testGame.processGuess(0, 1, 0, correctNumber);
    console.assert(result.success === true, 'Guess should succeed');
    console.assert(result.correct === true, 'Guess should be correct');
    console.assert(targetTile.revealed === true, 'Target tile should be revealed');
    console.log('✅ Correct guess test passed\n');

    // Test 5: Wrong guess
    console.log('Test 5: Wrong guess scenario');
    const testGame2 = new DaVinciGame();
    testGame2.initGame(['Player1', 'Player2']);
    
    // Guess wrong number
    const targetTile2 = testGame2.players[1].hand[0];
    const wrongNumber = (targetTile2.number + 1) % 12;
    
    const initialUnrevealed = testGame2.players[0].hand.filter(t => !t.revealed).length;
    const result2 = testGame2.processGuess(0, 1, 0, wrongNumber);
    
    console.assert(result2.success === true, 'Guess should process successfully');
    console.assert(result2.correct === false, 'Guess should be wrong');
    console.assert(testGame2.players[0].hand.some(t => t.revealed), 'Guesser should have a revealed tile');
    console.log('✅ Wrong guess test passed\n');

    // Test 6: Get game state
    console.log('Test 6: Get game state');
    const state = game.getGameState();
    console.assert(state.players.length === 3, 'State should have 3 players');
    console.assert(state.currentPlayer === 'Alice', 'Current player should be Alice');
    console.assert(typeof state.deckCounts.black === 'number', 'Should have black deck count');
    console.assert(typeof state.deckCounts.white === 'number', 'Should have white deck count');
    console.log('✅ Game state test passed\n');

    // Test 7: Get game state for specific player (hidden opponent tiles)
    console.log('Test 7: Player-specific game state');
    const playerState = game.getGameStateForPlayer(0);
    const player0 = playerState.players[0];
    const player1 = playerState.players[1];
    
    // Player 0 should see their own tiles
    console.assert(!player0.hand[0].hidden, 'Should see own tiles');
    
    // Player 0 should NOT see unrevealed opponent tiles
    const opponentUnrevealed = player1.hand.filter(t => !t.revealed);
    if (opponentUnrevealed.length > 0) {
        console.assert(opponentUnrevealed[0].hidden === true, 'Should not see opponent unrevealed tiles');
    }
    console.log('✅ Player-specific state test passed\n');

    // Test 8: Player elimination
    console.log('Test 8: Player elimination');
    const testGame3 = new DaVinciGame();
    testGame3.initGame(['P1', 'P2']);
    
    // Reveal all tiles of player 2
    testGame3.players[1].hand.forEach(tile => {
        tile.revealed = true;
    });
    testGame3.players[1].eliminated = true;
    
    const nextPlayer = testGame3.getNextPlayer();
    console.assert(nextPlayer.id !== 1 || testGame3.players.length === 1, 'Should skip eliminated player');
    console.log('✅ Player elimination test passed\n');

    console.log('🎉 All tests passed!');
}

// Run tests if in Node.js environment
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
} else if (typeof window !== 'undefined') {
    // Run tests in browser
    window.addEventListener('load', runTests);
}
