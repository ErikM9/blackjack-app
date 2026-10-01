import sinon from 'sinon';
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
  describeCard
} from '../../src/21.js';

/* Math.random returns values from 0 up to but never including 1, so this stands in for the top of its range */
const JUST_BELOW_ONE = 1 - Number.EPSILON;

QUnit.module('Rules', hooks => {
  hooks.afterEach(() => sinon.restore());

  QUnit.module('buildDeck', () => {
    QUnit.test('builds a standard 52-card deck with no duplicates', assert => {
      const deck = buildDeck();

      assert.strictEqual(deck.length, 52);
      assert.strictEqual(new Set(deck).size, 52);
    });

    QUnit.test('pairs every given rank with every given suit', assert => {
      assert.deepEqual(buildDeck(['heart', 'club'], ['A', 'K']), ['A-heart', 'K-heart', 'A-club', 'K-club']);
    });

    QUnit.test('returns no cards when there are no suits or no ranks', assert => {
      assert.deepEqual(buildDeck([], RANKS), []);
      assert.deepEqual(buildDeck(SUITS, []), []);
    });
  });

  QUnit.module('shuffleDeck', () => {
    QUnit.test('returns a new array holding the same cards and leaves the original untouched', assert => {
      const deck = buildDeck();
      const original = [...deck];

      const shuffled = shuffleDeck(deck);

      assert.notStrictEqual(shuffled, deck);
      assert.deepEqual([...shuffled].sort(), [...original].sort());
      assert.deepEqual(deck, original);
    });

    /* With Math.random pinned to 0 every step swaps with the front card, which gives one known order */
    QUnit.test('swaps every position with the front when Math.random returns 0', assert => {
      sinon.stub(Math, 'random').returns(0);

      assert.deepEqual(shuffleDeck(['a', 'b', 'c', 'd']), ['b', 'c', 'd', 'a']);
    });

    /* At the top of the random range every position swaps with itself, which catches off-by-one index maths */
    QUnit.test('leaves every card in place when Math.random returns just below 1', assert => {
      sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);

      assert.deepEqual(shuffleDeck(['a', 'b', 'c', 'd']), ['a', 'b', 'c', 'd']);
    });

    QUnit.test('handles empty and single-card decks', assert => {
      assert.deepEqual(shuffleDeck([]), []);
      assert.deepEqual(shuffleDeck(['A-spade']), ['A-spade']);
    });
  });

  QUnit.module('calculateScore', () => {
    QUnit.test.each('scores', {
      'an empty hand as 0': [[], 0],
      'number cards at face value': [['5-heart', '3-club'], 8],
      'a Jack, Queen and King as 10 each': [['J-club', 'Q-heart', 'K-spade'], 30],
      'an Ace as 11 when it fits': [['A-spade', '9-heart'], 20],
      'a natural blackjack as 21': [['A-spade', 'K-heart'], 21],
      'an Ace as 1 when 11 would bust': [['A-spade', 'K-heart', '5-club'], 16],
      'two Aces as 12': [['A-spade', 'A-heart'], 12],
      'two Aces and a 9 as a soft 21': [['A-spade', 'A-heart', '9-diamond'], 21],
      'four Aces and a 7 as 21': [['A-spade', 'A-heart', 'A-club', 'A-diamond', '7-spade'], 21],
      'a bust hand above 21': [['K-spade', 'Q-heart', '5-club'], 25]
    }, (assert, [hand, expected]) => {
      assert.strictEqual(calculateScore(hand), expected);
    });
  });

  QUnit.module('isBlackjack', () => {
    QUnit.test.each('returns', {
      'true for an Ace and a King': [['A-spade', 'K-heart'], true],
      'true for an Ace and a 10': [['A-heart', '10-diamond'], true],
      'false for a three-card 21': [['7-spade', '7-heart', '7-club'], false],
      'false for a two-card 20': [['K-spade', 'Q-heart'], false],
      'false for an empty hand': [[], false]
    }, (assert, [hand, expected]) => {
      assert.strictEqual(isBlackjack(hand), expected);
    });
  });

  QUnit.module('isBust', () => {
    /* Scores of 21 and 22 sit on either side of the bust boundary */
    QUnit.test.each('returns', {
      'false at exactly 21': [['K-spade', '9-heart', '2-club'], false],
      'true at 22': [['K-spade', 'Q-heart', '2-club'], true],
      'false when an Ace drops to 1 to keep the hand at 21': [['A-spade', 'K-heart', 'Q-club'], false],
      'false for an empty hand': [[], false]
    }, (assert, [hand, expected]) => {
      assert.strictEqual(isBust(hand), expected);
    });
  });

  QUnit.module('determineWinner', () => {
    QUnit.test.each('returns', {
      'lose when the player busts, even if the dealer busts too': [['K-spade', 'Q-heart', '5-club'], ['K-diamond', 'Q-club', '5-spade'], 'lose'],
      'win when only the dealer busts': [['K-spade', '7-heart'], ['K-diamond', 'Q-club', '5-spade'], 'win'],
      'win for the higher score': [['K-spade', '9-heart'], ['K-diamond', '7-club'], 'win'],
      'lose for the lower score': [['K-spade', '7-heart'], ['K-diamond', '9-club'], 'lose'],
      'draw for equal scores': [['K-spade', '8-heart'], ['K-diamond', '8-club'], 'draw'],
      'draw when both hands are natural blackjacks': [['A-spade', 'K-heart'], ['A-diamond', '10-club'], 'draw'],
      'win for a natural blackjack against a three-card 21': [['A-spade', 'K-heart'], ['6-club', '5-diamond', 'K-club'], 'win'],
      'lose for a three-card 21 against a dealer natural': [['5-spade', '6-heart', 'K-club'], ['A-club', 'K-diamond'], 'lose']
    }, (assert, [playerHand, dealerHand, expected]) => {
      assert.strictEqual(determineWinner(playerHand, dealerHand), expected);
    });
  });

  QUnit.module('shouldDealerHit', () => {
    /* The rule flips between 16 and 17, and the soft cases show an Ace counted as 11 is treated the same way */
    QUnit.test.each('returns', {
      'true on 12': [['7-spade', '5-heart'], true],
      'true on 16': [['K-spade', '6-heart'], true],
      'false on 17': [['K-spade', '7-heart'], false],
      'false on 18': [['K-spade', '8-heart'], false],
      'true on soft 16': [['A-spade', '5-heart'], true],
      'false on soft 17': [['A-spade', '6-heart'], false]
    }, (assert, [hand, expected]) => {
      assert.strictEqual(shouldDealerHit(hand), expected);
    });
  });

  QUnit.module('getResultMessage and getResultEmoji', () => {
    QUnit.test.each('describe', {
      'a win with the treasure line and a smiling face': ['win', 'treasure', '😃'],
      'a loss with the frog line and a crying face': ['lose', 'frog', '😢'],
      'a draw with the draw line and a neutral face': ['draw', 'draw', '😐']
    }, (assert, [result, keyword, emoji]) => {
      assert.true(getResultMessage(result).toLowerCase().includes(keyword));
      assert.strictEqual(getResultEmoji(result), emoji);
    });

    QUnit.test('fall back to the draw message and face for an unknown result', assert => {
      assert.strictEqual(getResultMessage('unknown'), getResultMessage('draw'));
      assert.strictEqual(getResultEmoji('unknown'), getResultEmoji('draw'));
    });
  });

  QUnit.module('describeCard', () => {
    QUnit.test.each('names', {
      'an Ace': ['A-spade', 'Ace of spades'],
      'a King': ['K-heart', 'King of hearts'],
      'a Queen': ['Q-diamond', 'Queen of diamonds'],
      'a Jack': ['J-club', 'Jack of clubs'],
      'a 10': ['10-heart', '10 of hearts'],
      'a 2': ['2-spade', '2 of spades']
    }, (assert, [card, expected]) => {
      assert.strictEqual(describeCard(card), expected);
    });
  });
});