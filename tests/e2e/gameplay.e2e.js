import table, { BASE_URL, cardImage } from './support/table.js';
import { dealFrom } from './support/rigged-deal.js';
import { getResultMessage } from '../../src/21.js';
import {
  SAFE_HIT,
  DEALER_BUSTS,
  BUST_ON_HIT,
  HIT_TO_21,
  NATURAL_BLACKJACK,
  PLAYER_WINS,
  PLAYER_LOSES
} from './support/deals.js';

fixture('Gameplay').page(BASE_URL);

test.clientScripts(dealFrom(SAFE_HIT))('adds the next card and its value to the player hand on Hit', async t => {
  await table.hit();

  await t
    .expect(table.playerCards.count).eql(3)
    .expect(table.playerCards.nth(2).getAttribute('src')).match(cardImage('3-club'))
    .expect(table.playerScore.innerText).eql('14')
    .expect(table.result.visible).notOk();
});

test.clientScripts(dealFrom(DEALER_BUSTS))('turns the hole card over and lets the dealer draw on Stand', async t => {
  await table.stand();

  await t
    .expect(table.holeCard.getStyleProperty('transform')).contains('matrix3d')
    .expect(table.dealerFaceUpCards.count).eql(2)
    .expect(table.dealerFaceUpCards.nth(1).getAttribute('src')).match(cardImage('9-heart'))
    .expect(table.dealerScore.innerText).eql('25')
    .expect(table.result.innerText).eql(getResultMessage('win'));
});

test.clientScripts(dealFrom(BUST_ON_HIT))('ends the round as a loss when a hit goes over 21', async t => {
  await table.hit();

  await t
    .expect(table.playerScore.innerText).eql('26')
    .expect(table.result.innerText).eql(getResultMessage('lose'))
    .expect(table.hitButton.hasAttribute('disabled')).ok()
    .expect(table.standButton.hasAttribute('disabled')).ok()
    .expect(table.dealerFaceUpCards.count).eql(1);
});

test.clientScripts(dealFrom(HIT_TO_21))('stands automatically when a hit makes exactly 21', async t => {
  await table.hit();

  await t
    .expect(table.playerScore.innerText).eql('21')
    .expect(table.dealerScore.innerText).eql('17')
    .expect(table.result.innerText).eql(getResultMessage('win'));
});

test.clientScripts(dealFrom(NATURAL_BLACKJACK))('settles a natural blackjack as soon as the cards are dealt', async t => {
  await t
    .expect(table.result.innerText).eql(getResultMessage('win'))
    .expect(table.holeCard.getStyleProperty('transform')).contains('matrix3d')
    .expect(table.hitButton.hasAttribute('disabled')).ok()
    .expect(table.replayButton.hasAttribute('disabled')).notOk();
});

test.clientScripts(dealFrom(PLAYER_WINS, PLAYER_LOSES))('deals a fresh round on Replay and clears the last one', async t => {
  await table.stand();
  await t.expect(table.orbs.count).gt(0);

  await table.replay();

  await t
    .expect(table.playerCards.nth(0).getAttribute('src')).match(cardImage('10-spade'))
    .expect(table.playerCards.count).eql(2)
    .expect(table.dealerFaceUpCards.count).eql(1)
    .expect(table.holeCard.getStyleProperty('transform')).eql('none')
    .expect(table.playerScore.innerText).eql('17')
    .expect(table.dealerScore.innerText).eql('9')
    .expect(table.result.visible).notOk()
    .expect(table.welcome.getStyleProperty('opacity')).eql('1')
    .expect(table.orbs.count).eql(0);
});