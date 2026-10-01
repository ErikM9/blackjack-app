import sinon from 'sinon';
import { BlackjackGame, buildDeck } from '../../src/21.js';
import { createRiggedGame } from './support/rigged-game.js';

/* Player 19 against a dealer showing a Queen with a 7 in the hole, so standing wins without the dealer drawing */
const PLAYER_19_VS_DEALER_17 = { player: ['K-spade', '9-heart'], dealer: ['7-club', 'Q-diamond'] };

/* Player 16 whose next card busts them, against a dealer 16 who would have drawn the 5 had the dealer played */
const BUST_ON_HIT = { player: ['K-spade', '6-heart'], dealer: ['10-club', '6-diamond'], next: ['Q-heart', '5-club'] };

QUnit.module('BlackjackGame', hooks => {
  hooks.afterEach(() => sinon.restore());

  QUnit.test('starts with empty hands and no round in progress', assert => {
    assert.deepEqual(new BlackjackGame().getState(), {
      playerHand: [],
      dealerHand: [],
      playerScore: 0,
      dealerScore: 0,
      gameActive: false,
      result: null,
      deckSize: 0
    });
  });

  QUnit.module('deal', () => {
    QUnit.test('deals two cards each, player first, and starts the round', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);

      game.deal();

      const { playerHand, dealerHand, gameActive, result } = game.getState();
      assert.deepEqual(
        { playerHand, dealerHand, gameActive, result },
        { playerHand: ['K-spade', '9-heart'], dealerHand: ['7-club', 'Q-diamond'], gameActive: true, result: null }
      );
    });

    QUnit.test('deals from a freshly shuffled, complete deck', assert => {
      const game = new BlackjackGame();

      game.deal();

      const cardsInPlay = [...game.playerHand, ...game.dealerHand, ...game.deck];
      assert.deepEqual(cardsInPlay.sort(), buildDeck().sort());
    });

    QUnit.test('reports the dealt state through onUpdate', assert => {
      const onUpdate = sinon.spy();
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17, { onUpdate });

      game.deal();

      assert.true(onUpdate.calledOnceWith(game.getState()));
    });

    QUnit.test('settles a natural blackjack straight away', assert => {
      const onResult = sinon.spy();
      const game = createRiggedGame({ player: ['A-spade', 'K-heart'], dealer: ['10-club', '7-diamond'] }, { onResult });

      game.deal();

      assert.false(game.gameActive);
      assert.true(onResult.calledOnceWith('win'));
    });

    QUnit.test('clears the previous round', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);
      game.deal();
      game.stand();

      game.deal();

      assert.deepEqual(
        [game.playerHand.length, game.dealerHand.length, game.gameActive, game.result],
        [2, 2, true, null]
      );
    });
  });

  QUnit.module('getState', () => {
    QUnit.test('counts only the face-up dealer card while the round is in progress', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);

      game.deal();

      const { playerScore, dealerScore } = game.getState();
      assert.deepEqual({ playerScore, dealerScore }, { playerScore: 19, dealerScore: 10 });
    });

    QUnit.test('counts the whole dealer hand once the round is over', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);
      game.deal();

      game.stand();

      assert.strictEqual(game.getState().dealerScore, 17);
    });

    QUnit.test('returns copies of the hands so callers cannot change the game', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);
      game.deal();

      const state = game.getState();
      state.playerHand.push('A-club');
      state.dealerHand.length = 0;

      assert.deepEqual([game.playerHand.length, game.dealerHand.length], [2, 2]);
    });
  });

  QUnit.module('hit', () => {
    QUnit.test('adds the next card to the player hand and reports it', assert => {
      const onPlayerCard = sinon.spy();
      const onUpdate = sinon.spy();
      const game = createRiggedGame(
        { player: ['5-spade', '6-heart'], dealer: ['10-club', '7-diamond'], next: ['3-club'] },
        { onPlayerCard, onUpdate }
      );
      game.deal();
      onUpdate.resetHistory();

      game.hit();

      assert.deepEqual(game.playerHand, ['5-spade', '6-heart', '3-club']);
      assert.true(onPlayerCard.calledOnceWith('3-club'));
      assert.true(onUpdate.calledOnceWith(game.getState()));
      assert.deepEqual([game.getState().playerScore, game.gameActive], [14, true]);
    });

    QUnit.test('ends the round as a loss on a bust without letting the dealer draw', assert => {
      const game = createRiggedGame(BUST_ON_HIT);
      game.deal();

      game.hit();

      assert.deepEqual([game.gameActive, game.result], [false, 'lose']);
      assert.deepEqual(game.dealerHand, ['10-club', '6-diamond']);
    });

    QUnit.test('stands automatically when the player reaches exactly 21', assert => {
      const game = createRiggedGame({ player: ['9-spade', '2-heart'], dealer: ['10-club', '6-diamond'], next: ['K-heart', '3-club'] });
      game.deal();

      game.hit();

      assert.deepEqual(game.dealerHand, ['10-club', '6-diamond', '3-club']);
      assert.deepEqual([game.gameActive, game.result], [false, 'win']);
    });

    QUnit.test('does nothing once the round is over', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);
      game.deal();
      game.stand();

      game.hit();

      assert.deepEqual(game.playerHand, ['K-spade', '9-heart']);
    });
  });

  QUnit.module('stand', () => {
    QUnit.test('makes the dealer draw until reaching at least 17 and reports each card', assert => {
      const onDealerCard = sinon.spy();
      const game = createRiggedGame(
        { player: ['K-spade', '9-heart'], dealer: ['10-club', '2-diamond'], next: ['3-heart', 'A-club', '5-spade', '9-club'] },
        { onDealerCard }
      );
      game.deal();

      game.stand();

      assert.deepEqual(onDealerCard.args.flat(), ['3-heart', 'A-club', '5-spade']);
      assert.deepEqual([game.getState().dealerScore, game.result], [21, 'lose']);
    });

    QUnit.test('leaves a dealer on 17 standing', assert => {
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17);
      game.deal();

      game.stand();

      assert.deepEqual(game.dealerHand, ['7-club', 'Q-diamond']);
    });

    QUnit.test('ends the round and reports the result', assert => {
      const onResult = sinon.spy();
      const onUpdate = sinon.spy();
      const game = createRiggedGame(PLAYER_19_VS_DEALER_17, { onResult, onUpdate });
      game.deal();
      onUpdate.resetHistory();

      game.stand();

      assert.deepEqual([game.gameActive, game.result], [false, 'win']);
      assert.true(onResult.calledOnceWith('win'));
      assert.true(onUpdate.calledOnceWith(game.getState()));
    });

    QUnit.test('does nothing once the round is over', assert => {
      const onDealerCard = sinon.spy();
      const game = createRiggedGame(BUST_ON_HIT, { onDealerCard });
      game.deal();
      game.hit();

      game.stand();

      assert.true(onDealerCard.notCalled);
      assert.strictEqual(game.result, 'lose');
    });
  });

  QUnit.module('drawCard', () => {
    QUnit.test('starts a fresh shuffled deck when the current one runs out', assert => {
      const game = new BlackjackGame();

      const card = game.drawCard();

      assert.true(buildDeck().includes(card));
      assert.strictEqual(game.deck.length, 51);
    });
  });
});