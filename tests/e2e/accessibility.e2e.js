import { ClientFunction } from 'testcafe';
import table, { BASE_URL } from './support/table.js';
import { dealFrom } from './support/rigged-deal.js';
import { PLAYER_WINS, PLAYER_LOSES } from './support/deals.js';

/* Automated scans only catch part of what WCAG covers, so the game-specific checks below stay hand-written */
const wcagViolations = ClientFunction(() => axe
  .run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
  .then(results => results.violations.flatMap(violation => violation.nodes
    .map(node => `${violation.id} on ${node.target.join(' ')}: ${violation.help}`))));

fixture('Accessibility')
  .page(BASE_URL)
  .clientScripts({ module: 'axe-core' }, dealFrom(PLAYER_WINS, PLAYER_LOSES));

/* Both scans wait for the table to stop fading, since a contrast check on half-faded text fails however strong the finished colours are */
test('passes an automated WCAG 2.1 A and AA scan during a round', async t => {
  await table.waitForPlayerTurn();
  await table.waitUntilStill();

  await t.expect(await wcagViolations()).eql([]);
});

test('passes the same scan once the round is over', async t => {
  await table.stand();
  await t.expect(table.result.visible).ok();
  await table.waitUntilStill();

  await t.expect(await wcagViolations()).eql([]);
});

test('names every face-up card so screen readers can read the hands', async t => {
  await t
    .expect(table.playerCards.nth(0).getAttribute('alt')).eql('King of spades')
    .expect(table.playerCards.nth(1).getAttribute('alt')).eql('9 of hearts')
    .expect(table.dealerFaceUpCards.nth(0).getAttribute('alt')).eql('Queen of diamonds');
});

test('keeps the hole card secret from screen readers until it is turned over', async t => {
  await t
    .expect(table.holeCardBack.getAttribute('alt')).eql('Face-down card')
    .expect(table.holeCardFront.getAttribute('aria-hidden')).eql('true');

  await table.stand();

  await t
    .expect(table.holeCardFront.hasAttribute('aria-hidden')).notOk()
    .expect(table.holeCardFront.getAttribute('alt')).eql('7 of clubs')
    .expect(table.holeCardBack.getAttribute('aria-hidden')).eql('true');
});

test('labels each hand as a group', async t => {
  await t
    .expect(table.dealerHand.getAttribute('role')).eql('group')
    .expect(table.dealerHand.getAttribute('aria-label')).eql('Dealer hand')
    .expect(table.playerHand.getAttribute('role')).eql('group')
    .expect(table.playerHand.getAttribute('aria-label')).eql('Player hand');
});

test('announces each score together with whose score it is', async t => {
  await t
    .expect(table.playerScoreRegion.getAttribute('aria-live')).eql('polite')
    .expect(table.playerScoreRegion.getAttribute('aria-atomic')).eql('true')
    .expect(table.playerScoreRegion.innerText).eql('Your score: 19')
    .expect(table.dealerScoreRegion.getAttribute('aria-live')).eql('polite')
    .expect(table.dealerScoreRegion.getAttribute('aria-atomic')).eql('true')
    .expect(table.dealerScoreRegion.innerText).eql("Cassius' score: 10");
});

test('keeps keyboard focus on a usable button through Stand and Replay', async t => {
  await table.waitForPlayerTurn();

  await t
    .pressKey('tab tab')
    .expect(table.focusedElement.id).eql('stand')
    .pressKey('enter')
    .expect(table.result.visible).ok()
    .expect(table.focusedElement.id).eql('replay')
    .pressKey('enter')
    .expect(table.playerScore.innerText).eql('17')
    .expect(table.focusedElement.id).eql('hit');
});