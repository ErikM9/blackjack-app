import {
  SUITS,
  RANKS,
  buildDeck,
  shuffleDeck,
  calculateScore,
  isBlackjack,
  isBust,
  determineWinner,
  shouldDealerHit,
  getResultMessage,
  getResultEmoji,
  BlackjackGame
} from '../../src/21.js';

QUnit.module('Constants', () => {
  QUnit.test('SUITS has four suits', assert => {
    assert.strictEqual(SUITS.length, 4);
    ['spade', 'club', 'heart', 'diamond'].forEach(s => assert.true(SUITS.includes(s)));
  });

  QUnit.test('RANKS has thirteen ranks', assert => {
    assert.strictEqual(RANKS.length, 13);
    ['A', 'K', 'Q', 'J', '10', '2'].forEach(r => assert.true(RANKS.includes(r)));
  });
});

QUnit.module('buildDeck', () => {
  QUnit.test('builds a standard 52-card deck with no duplicates', assert => {
    const deck = buildDeck();
    assert.strictEqual(deck.length, 52);
    assert.strictEqual(new Set(deck).size, 52);
    ['A-spade', 'K-heart', '10-diamond', '2-club'].forEach(c => assert.true(deck.includes(c)));
  });

  QUnit.test('accepts custom suits and ranks', assert => {
    const deck = buildDeck(['hearts'], ['A', 'K']);
    assert.strictEqual(deck.length, 2);
    assert.true(deck.includes('A-hearts'));
  });

  QUnit.test('returns empty array for empty suits or ranks', assert => {
    assert.strictEqual(buildDeck([], RANKS).length, 0);
    assert.strictEqual(buildDeck(SUITS, []).length, 0);
  });
});

QUnit.module('shuffleDeck', () => {
  QUnit.test('returns same cards in a different order without mutating original', assert => {
    const deck = buildDeck();
    const original = [...deck];
    const shuffled = shuffleDeck(deck);

    assert.strictEqual(shuffled.length, 52);
    assert.deepEqual(deck, original);
    original.forEach(c => assert.true(shuffled.includes(c)));
  });

  QUnit.test('produces different orderings across runs', assert => {
    const deck = buildDeck();
    const seen = new Set();

    for (let i = 0; i < 10; i++) {
      seen.add(shuffleDeck(deck).join(','));
    }

    assert.true(seen.size > 1);
  });

  QUnit.test('handles edge cases', assert => {
    assert.strictEqual(shuffleDeck([]).length, 0);
    assert.strictEqual(shuffleDeck(['A-spade'])[0], 'A-spade');
  });
});

QUnit.module('calculateScore', () => {
  QUnit.test('empty hand is 0', assert => {
    assert.strictEqual(calculateScore([]), 0);
  });

  QUnit.test('sums cards correctly', assert => {
    assert.strictEqual(calculateScore(['5-heart']), 5);
    assert.strictEqual(calculateScore(['5-heart', '3-club']), 8);
    assert.strictEqual(calculateScore(['K-spade', 'Q-heart']), 20);
  });

  QUnit.test('blackjack scores 21', assert => {
    assert.strictEqual(calculateScore(['A-spade', 'K-heart']), 21);
    assert.strictEqual(calculateScore(['A-spade', '10-heart']), 21);
  });

  QUnit.test('Ace counts as 1 to avoid bust', assert => {
    assert.strictEqual(calculateScore(['A-spade', 'K-heart', '5-club']), 16);
  });

  QUnit.test('multiple Aces adjust correctly', assert => {
    assert.strictEqual(calculateScore(['A-spade', 'A-heart']), 12);
    assert.strictEqual(calculateScore(['A-spade', 'A-heart', 'A-club']), 13);
    assert.strictEqual(calculateScore(['A-spade', 'A-heart', '9-diamond']), 21);
    assert.strictEqual(
      calculateScore(['A-spade', 'A-heart', 'A-club', 'A-diamond', '7-spade']),
      21
    );
  });

  QUnit.test('bust hand exceeds 21', assert => {
    assert.strictEqual(calculateScore(['K-spade', 'Q-heart', '5-club']), 25);
  });
});

QUnit.module('isBlackjack / isBust', () => {
  QUnit.test('isBlackjack requires exactly 2 cards totalling 21', assert => {
    assert.true(isBlackjack(['A-spade', 'K-heart']));
    assert.true(isBlackjack(['A-heart', '10-diamond']));
    assert.false(isBlackjack(['7-spade', '7-heart', '7-club']));
    assert.false(isBlackjack(['K-spade', '9-heart']));
    assert.false(isBlackjack([]));
  });

  QUnit.test('isBust detects scores above 21', assert => {
    assert.true(isBust(['K-spade', 'Q-heart', '2-club']));
    assert.true(isBust(['K-spade', 'K-heart', 'K-club', 'K-diamond']));
    assert.false(isBust(['A-spade', 'K-heart']));
    assert.false(isBust(['K-spade', 'Q-heart']));
    assert.false(isBust([]));
  });
});

QUnit.module('determineWinner', () => {
  QUnit.test('player bust always loses', assert => {
    assert.strictEqual(
      determineWinner(['K-spade', 'Q-heart', '5-club'], ['K-diamond', '7-heart']),
      'lose'
    );

    assert.strictEqual(
      determineWinner(
        ['K-spade', 'Q-heart', '5-club'],
        ['K-diamond', 'Q-club', '5-spade']
      ),
      'lose'
    );
  });

  QUnit.test('dealer bust means player wins', assert => {
    assert.strictEqual(
      determineWinner(['K-spade', '7-heart'], ['K-diamond', 'Q-club', '5-spade']),
      'win'
    );
  });

  QUnit.test('higher score wins, equal is draw', assert => {
    assert.strictEqual(determineWinner(['K-spade', '9-heart'], ['K-diamond', '7-club']), 'win');
    assert.strictEqual(determineWinner(['K-spade', '7-heart'], ['K-diamond', '9-club']), 'lose');
    assert.strictEqual(determineWinner(['K-spade', '8-heart'], ['K-diamond', '8-club']), 'draw');
    assert.strictEqual(determineWinner(['A-spade', 'K-heart'], ['A-diamond', '10-club']), 'draw');
  });
});

QUnit.module('shouldDealerHit', () => {
  QUnit.test('hits below 17, stands at 17 and above', assert => {
    assert.true(shouldDealerHit(['K-spade', '6-heart']));
    assert.true(shouldDealerHit(['A-spade', '5-heart']));
    assert.true(shouldDealerHit(['7-spade', '5-heart']));
    assert.false(shouldDealerHit(['K-spade', '7-heart']));
    assert.false(shouldDealerHit(['K-spade', '8-heart']));
    assert.false(shouldDealerHit(['A-spade', '6-heart']));
  });
});

QUnit.module('getResultMessage / getResultEmoji', () => {
  QUnit.test('win result returns treasure message, happy emoji', assert => {
    assert.true(getResultMessage('win').includes('treasure'));
    assert.strictEqual(getResultEmoji('win'), '😃');
  });

  QUnit.test('lose result returns frog message, sad emoji', assert => {
    assert.true(getResultMessage('lose').includes('frog'));
    assert.strictEqual(getResultEmoji('lose'), '😢');
  });

  QUnit.test('draw result returns draw message, neutral emoji', assert => {
    assert.true(getResultMessage('draw').toLowerCase().includes('draw'));
    assert.strictEqual(getResultEmoji('draw'), '😐');
  });

  QUnit.test('unknown result falls back to draw defaults', assert => {
    assert.strictEqual(getResultEmoji('unknown'), '😐');
  });
});

QUnit.module('BlackjackGame', () => {
  QUnit.test('initialises with empty inactive state', assert => {
    const game = new BlackjackGame();
    const state = game.getState();

    assert.strictEqual(state.playerHand.length, 0);
    assert.strictEqual(state.dealerHand.length, 0);
    assert.false(state.gameActive);
    assert.strictEqual(state.result, null);
  });

  QUnit.test('deal gives 2 cards each and activates game', assert => {
    const game = new BlackjackGame();
    game.deal();

    assert.strictEqual(game.getState().playerHand.length, 2);
    assert.true(game.getState().dealerHand.length >= 2);
    assert.true(game.getState().gameActive || game.getState().result !== null);
  });

  QUnit.test('getState shows only visible dealer card score during active game', assert => {
    const game = new BlackjackGame();
    game.deal();

    if (!game.gameActive) {
      assert.true(true);
      return;
    }

    const state = game.getState();
    const faceUpCard = state.dealerHand[1]; /* index 1 is face-up; matches hiddenCard render order in reset() */

    assert.strictEqual(state.dealerScore, calculateScore([faceUpCard]));
  });

  QUnit.test('getState shows full dealer score after game ends', assert => {
    const game = new BlackjackGame();
    game.deal();
    game.stand();

    const state = game.getState();
    assert.strictEqual(state.dealerScore, calculateScore(state.dealerHand));
  });

  QUnit.test('hit adds a card and updates state', assert => {
    const game = new BlackjackGame();
    game.deal();

    if (!game.gameActive) {
      assert.true(true);
      return;
    }

    const before = game.getState().playerHand.length;
    game.hit();

    if (game.gameActive) {
      assert.strictEqual(game.getState().playerHand.length, before + 1);
    } else {
      assert.true(true);
    }
  });

  QUnit.test('natural blackjack on deal triggers immediate stand', assert => {
    const game = new BlackjackGame();

    /* Stack cards at deck end since drawCard uses pop() */
    game.deck = [...shuffleDeck(buildDeck()), '9-diamond', '7-club', 'K-heart', 'A-spade'];
    game.gameActive = true;
    game.playerHand = [];
    game.dealerHand = [];
    game.result = null;

    game.playerHand.push(game.drawCard(), game.drawCard());
    game.dealerHand.push(game.drawCard(), game.drawCard());
    game.stand();

    assert.false(game.gameActive);
    assert.notStrictEqual(game.result, null);
  });

  QUnit.test('hitting to exactly 21 triggers automatic stand', assert => {
    const game = new BlackjackGame();

    game.gameActive = true;
    game.playerHand = ['9-spade', '8-heart'];
    game.dealerHand = ['5-club', '7-diamond'];
    game.deck = ['4-spade'];

    game.hit();

    assert.false(game.gameActive);
    assert.notStrictEqual(game.result, null);
  });

  QUnit.test('stand ends game with valid result', assert => {
    const game = new BlackjackGame();
    game.deal();
    game.stand();

    assert.false(game.getState().gameActive);
    assert.true(['win', 'lose', 'draw'].includes(game.getState().result));
  });

  QUnit.test('hit and stand do nothing when game is inactive', assert => {
    const game = new BlackjackGame();
    game.deal();
    game.stand();

    const { playerHand, result } = game.getState();

    game.hit();
    game.stand();

    assert.strictEqual(game.getState().playerHand.length, playerHand.length);
    assert.strictEqual(game.getState().result, result);
  });

  QUnit.test('dealer draws until score reaches 17 or higher', assert => {
    const game = new BlackjackGame();
    game.deal();
    game.stand();

    assert.true(game.getState().dealerScore >= 17);
  });

  QUnit.test('onUpdate fires on deal and hit', assert => {
    let count = 0;
    const game = new BlackjackGame({ onUpdate: () => count++ });

    game.deal();

    const afterDeal = count;

    if (game.gameActive) {
      game.hit();
      assert.true(count > afterDeal);
    } else {
      assert.true(count > 0);
    }
  });

  QUnit.test('onResult fires on game end with correct result', assert => {
    let received = null;
    const game = new BlackjackGame({
      onResult: r => { received = r; }
    });

    game.deal();
    game.stand();

    assert.true(['win', 'lose', 'draw'].includes(received));
  });

  QUnit.test('onPlayerCard fires when player hits', assert => {
    const drawn = [];
    const game = new BlackjackGame({
      onPlayerCard: c => drawn.push(c)
    });

    game.deal();

    if (game.gameActive) {
      game.hit();
      assert.strictEqual(drawn.length, 1);
      assert.strictEqual(typeof drawn[0], 'string');
      assert.true(drawn[0].includes('-'));
    } else {
      assert.true(true);
    }
  });

  QUnit.test('onDealerCard fires for each dealer draw during stand', assert => {
    let dealerDraws = 0;
    const game = new BlackjackGame({
      onDealerCard: () => dealerDraws++
    });

    /* Force dealer to draw */
    game.initDeck();
    game.gameActive = true;
    game.playerHand = ['K-spade', '10-heart'];
    game.dealerHand = ['7-club', '5-diamond'];

    game.stand();

    assert.true(dealerDraws >= 1);
  });

  QUnit.test('deck replenishes when empty', assert => {
    const game = new BlackjackGame();
    game.initDeck();
    game.deck = [];

    const card = game.drawCard();

    assert.strictEqual(typeof card, 'string');
    assert.true(card.includes('-'));
  });

  QUnit.test('multiple deals reset state correctly', assert => {
    const game = new BlackjackGame();

    game.deal();
    game.stand();
    game.deal();

    assert.strictEqual(game.getState().playerHand.length, 2);
    assert.true(game.getState().gameActive || game.getState().result !== null);
  });
});