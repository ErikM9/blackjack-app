import table, { BASE_URL } from './support/table.js';
import { dealFrom } from './support/rigged-deal.js';
import { getResultMessage, getResultEmoji } from '../../src/21.js';
import { PLAYER_WINS, PLAYER_LOSES, DRAW } from './support/deals.js';

const OUTCOMES = [
  { outcome: 'win', deal: PLAYER_WINS },
  { outcome: 'lose', deal: PLAYER_LOSES },
  { outcome: 'draw', deal: DRAW }
];

fixture('Round results').page(BASE_URL);

OUTCOMES.forEach(({ outcome, deal }) => {
  test.clientScripts(dealFrom(deal))(`shows the ${outcome} message and ${getResultEmoji(outcome)} orbs after Stand`, async t => {
    await table.stand();

    await t
      .expect(table.result.innerText).eql(getResultMessage(outcome))
      .expect(table.orbs.count).gt(0)
      .expect(table.orbs.nth(0).innerText).eql(getResultEmoji(outcome))
      .expect(table.welcome.getStyleProperty('opacity')).eql('0')
      .expect(table.standButton.hasAttribute('disabled')).ok()
      .expect(table.replayButton.hasAttribute('disabled')).notOk();
  });
});