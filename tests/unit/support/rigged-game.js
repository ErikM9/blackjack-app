import sinon from 'sinon';
import { BlackjackGame } from '../../../src/21.js';

/* Builds a game that deals the given cards in order: two to the player, then the dealer's hole card and face-up card, then any draws */
export function createRiggedGame({ player, dealer, next = [] }, callbacks = {}) {
  const game = new BlackjackGame(callbacks);
  const drawOrder = [...player, ...dealer, ...next];

  /* The game deals with pop(), so the deck is stored in reverse draw order */
  sinon.stub(game, 'initDeck').callsFake(() => {
    game.deck = [...drawOrder].reverse();
  });

  return game;
}