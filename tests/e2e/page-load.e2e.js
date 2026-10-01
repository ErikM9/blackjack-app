import { ClientFunction } from 'testcafe';
import table, { BASE_URL, cardImage } from './support/table.js';
import { dealFrom } from './support/rigged-deal.js';
import { PLAYER_WINS } from './support/deals.js';

const documentTitle = ClientFunction(() => document.title);

fixture('Page load')
  .page(BASE_URL)
  .clientScripts(dealFrom(PLAYER_WINS));

test('shows the game name and the archmage welcome', async t => {
  await t
    .expect(documentTitle()).eql('Twenty-One')
    .expect(table.welcome.textContent).contains('Archmage Volans')
    .expect(table.archmage.visible).ok();
});

test('deals the player two face-up cards', async t => {
  await t
    .expect(table.playerCards.count).eql(2)
    .expect(table.playerCards.nth(0).getAttribute('src')).match(cardImage('K-spade'))
    .expect(table.playerCards.nth(1).getAttribute('src')).match(cardImage('9-heart'));
});

test('deals the dealer one face-down card and one face-up card', async t => {
  await t
    .expect(table.holeCardBack.getAttribute('src')).match(cardImage('back'))
    .expect(table.holeCard.getStyleProperty('transform')).eql('none')
    .expect(table.dealerFaceUpCards.count).eql(1)
    .expect(table.dealerFaceUpCards.nth(0).getAttribute('src')).match(cardImage('Q-diamond'));
});

test('scores the player hand and only the face-up dealer card', async t => {
  await t
    .expect(table.playerScore.innerText).eql('19')
    .expect(table.dealerScore.innerText).eql('10');
});

test('keeps the result hidden while the round is in progress', async t => {
  await table.waitForPlayerTurn();

  await t
    .expect(table.result.visible).notOk()
    .expect(table.result.innerText).eql('');
});

test('fills the background with sparks', async t => {
  await t.expect(table.sparks.count).gt(0);
});