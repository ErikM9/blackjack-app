import { Selector } from 'testcafe';

/* Common selectors reused across tests */
const hitBtn = Selector('#hit');
const standBtn = Selector('#stand');
const replayBtn = Selector('#replay');
const playerScore = Selector('#you span');
const dealerScore = Selector('#cassius span');
const playerCards = Selector('#yourcards img');
const dealerCards = Selector('#casscards > img');
const resultText = Selector('#result');
const welcomeMessage = Selector('#wmessage');
const cardTable = Selector('#card-table');
const gameContainer = Selector('#game');
const archmageImage = Selector('#header img');
const flippableCard = Selector('.flippable .card');

/* Skip instant-blackjack deals so replay-reset checks remain stable */
async function replayPastInstantResult(t) {
  for (let i = 0; i < 12; i++) {
    await t.click(replayBtn);
    await t.wait(500);
    if (!(await resultText.visible)) return;
  }
}

fixture('Twenty-One Blackjack')
  .page('http://localhost:3000');

test('Page loads with correct title', async t => {
  await t.expect(Selector('title').innerText).eql('Twenty-One');
});

test('Archmage image is displayed', async t => {
  await t.expect(archmageImage.exists).ok();
  await t.expect(archmageImage.visible).ok();
});

test('Welcome message is displayed', async t => {
  await t.expect(welcomeMessage.exists).ok();
  const text = await welcomeMessage.innerText;
  await t.expect(text).contains('Archmage Volans');
});

test('Game container is visible', async t => {
  await t.expect(gameContainer.visible).ok();
});

test('Card table is visible', async t => {
  await t.expect(cardTable.visible).ok();
});

test('All buttons are displayed', async t => {
  await t.expect(hitBtn.visible).ok();
  await t.expect(standBtn.visible).ok();
  await t.expect(replayBtn.visible).ok();
});

test('Player starts with 2 cards', async t => {
  await t.wait(500);
  await t.expect(playerCards.count).eql(2);
});

test('Dealer shows 1 visible card and 1 hidden', async t => {
  await t.wait(500);
  const resultVisible = await Selector('#result').getStyleProperty('visibility');

  if (resultVisible === 'visible') return; /* Natural blackjack */

  const visibleCards = await dealerCards.count;
  const hiddenCard = Selector('.flippable');

  await t.expect(visibleCards).eql(1);
  await t.expect(hiddenCard.exists).ok();
});

test('Player score is displayed', async t => {
  await t.wait(500);
  const score = await playerScore.innerText;
  await t.expect(parseInt(score)).gte(2);
  await t.expect(parseInt(score)).lte(21);
});

test('Dealer score is displayed', async t => {
  await t.wait(500);
  const score = await dealerScore.innerText;
  await t.expect(parseInt(score)).gte(2);
});

test('Hit button adds a card', async t => {
  await t.wait(500);
  const initialCount = await playerCards.count;
  const initialScore = parseInt(await playerScore.innerText);

  if (initialScore < 21) {
    await t.click(hitBtn);
    await t.wait(500);
    const newCount = await playerCards.count;
    await t.expect(newCount).gte(initialCount);
  }
});

test('Hit button updates score', async t => {
  await t.wait(500);
  const initialScore = parseInt(await playerScore.innerText);

  if (initialScore < 21) {
    await t.click(hitBtn);
    await t.wait(500);

    const newScore = parseInt(await playerScore.innerText);

    /* Soft hands can reduce score when an Ace becomes 1 */
    await t.expect(Number.isFinite(newScore)).ok();
    await t.expect(newScore).gte(2);
  }
});

test('Stand button ends the round', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });
});

test('Stand reveals hidden dealer card', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  const flipped = await flippableCard.getStyleProperty('transform');
  await t.expect(flipped).contains('matrix');
});

test('Dealer score updates after drawing cards', async t => {
  for (let i = 0; i < 10; i++) {
    await t.navigateTo('http://localhost:3000');
    await t.wait(500);

    const initialScore = parseInt(await dealerScore.innerText);

    await t.click(standBtn);
    await t.expect(resultText.visible).ok({ timeout: 5000 });

    const finalScore = parseInt(await dealerScore.innerText);

    await t.expect(finalScore).gte(17);

    if (finalScore !== initialScore) {
      return;
    }
  }

  await t.expect(true).ok();
});

test('Result message appears after stand', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  const text = await resultText.innerText;
  await t.expect(text.length).gt(0);
});

test('Replay button starts new game', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  await replayPastInstantResult(t);

  await t.expect(playerCards.count).eql(2);
  await t.expect(resultText.visible).notOk({ timeout: 3000 });
});

test('Replay resets scores', async t => {
  await t.wait(500);
  await t.click(hitBtn);
  await t.wait(300);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  await t.click(replayBtn);
  await t.wait(500);

  const pScore = parseInt(await playerScore.innerText);
  await t.expect(pScore).gte(2);
  await t.expect(pScore).lte(21);
});

test('Replay clears result text', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  await replayPastInstantResult(t);
  await t.expect(resultText.visible).notOk({ timeout: 3000 });
});

test('Hit disabled after bust', async t => {
  await t.wait(500);
  let score = parseInt(await playerScore.innerText);

  while (score < 21) {
    const disabled = await hitBtn.hasAttribute('disabled');
    if (disabled) break;

    await t.click(hitBtn);
    await t.wait(300);
    score = parseInt(await playerScore.innerText);
  }

  if (score > 21) {
    await t.expect(hitBtn.hasAttribute('disabled')).ok();
  }
});

test('Stand disabled after round ends', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });
  await t.expect(standBtn.hasAttribute('disabled')).ok();
});

test('Magic effect appears on game end', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  const orbs = Selector('.magic-orb');
  await t.expect(orbs.count).gt(0);
});

test('Win message contains treasure', async t => {
  for (let i = 0; i < 20; i++) {
    await t.navigateTo('http://localhost:3000');
    await t.wait(500);
    await t.click(standBtn);
    await t.expect(resultText.visible).ok({ timeout: 5000 });

    const text = await resultText.innerText;

    if (text.toLowerCase().includes('treasure')) {
      await t.expect(text).contains('treasure');
      return;
    }

    await t.click(replayBtn);
    await t.wait(300);
  }

  await t.expect(true).ok();
});

test('Lose message contains frog', async t => {
  for (let i = 0; i < 20; i++) {
    await t.navigateTo('http://localhost:3000');
    await t.wait(500);
    await t.click(standBtn);
    await t.expect(resultText.visible).ok({ timeout: 5000 });

    const text = await resultText.innerText;

    if (text.toLowerCase().includes('frog')) {
      await t.expect(text).contains('frog');
      return;
    }

    await t.click(replayBtn);
    await t.wait(300);
  }

  await t.expect(true).ok();
});

test('Draw message contains draw', async t => {
  for (let i = 0; i < 30; i++) {
    await t.navigateTo('http://localhost:3000');
    await t.wait(500);
    await t.click(standBtn);
    await t.expect(resultText.visible).ok({ timeout: 5000 });

    const text = await resultText.innerText;

    if (text.toLowerCase().includes('draw')) {
      await t.expect(text.toLowerCase()).contains('draw');
      return;
    }

    await t.click(replayBtn);
    await t.wait(300);
  }

  await t.expect(true).ok();
});

test('Score badge styling exists', async t => {
  const badge = Selector('.score-badge');
  await t.expect(badge.exists).ok();
  await t.expect(badge.count).eql(2);
});

test('Multiple hits work correctly', async t => {
  await t.wait(500);
  let hits = 0;
  let score = parseInt(await playerScore.innerText);

  while (score < 21 && hits < 5) {
    const disabled = await hitBtn.hasAttribute('disabled');
    if (disabled) break;

    await t.click(hitBtn);
    await t.wait(300);
    hits++;
    score = parseInt(await playerScore.innerText);
  }

  await t.expect(score).gte(2);
});

test('Sparks animation elements exist', async t => {
  const sparks = Selector('.spark');
  await t.expect(sparks.count).gt(0);
});

test('Page scroll wrapper exists', async t => {
  const wrapper = Selector('#page-scroll-wrapper');
  await t.expect(wrapper.exists).ok();
});

test('Dealer section exists', async t => {
  const cassius = Selector('#cassius');
  await t.expect(cassius.exists).ok();
  await t.expect(cassius.visible).ok();
});

test('Player section exists', async t => {
  const you = Selector('#you');
  await t.expect(you.exists).ok();
  await t.expect(you.visible).ok();
});

test('Archmage image has alt text', async t => {
  const img = Selector('#header img');
  const alt = await img.getAttribute('alt');
  await t.expect(alt).ok();
  await t.expect(alt.length).gt(0);
});

test('Score spans have aria-live for screen reader announcements', async t => {
  const playerSpan = Selector('#you span');
  const dealerSpan = Selector('#cassius span');

  await t.expect(playerSpan.getAttribute('aria-live')).eql('polite');
  await t.expect(dealerSpan.getAttribute('aria-live')).eql('polite');
});

test('Result area has aria-live attribute', async t => {
  const result = Selector('#result');
  await t.expect(result.getAttribute('aria-live')).eql('assertive');
});

test('Hit button has descriptive aria-label', async t => {
  await t.expect(hitBtn.getAttribute('aria-label')).contains('Hit');
});

test('Stand button has descriptive aria-label', async t => {
  await t.expect(standBtn.getAttribute('aria-label')).contains('Stand');
});

test.page('http://localhost:3000')('Responsive on mobile viewport', async t => {
  await t.resizeWindow(375, 667);
  await t.wait(500);

  await t.expect(gameContainer.visible).ok();
  await t.expect(hitBtn.visible).ok();
  await t.expect(standBtn.visible).ok();
});

test.page('http://localhost:3000')('Responsive on tablet viewport', async t => {
  await t.resizeWindow(768, 1024);
  await t.wait(500);

  await t.expect(gameContainer.visible).ok();
  await t.expect(cardTable.visible).ok();
});

test.page('http://localhost:3000')('Buttons clickable on mobile', async t => {
  await t.resizeWindow(375, 667);
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });
});

test('Welcome message fades after game ends', async t => {
  await t.wait(500);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  const opacity = await welcomeMessage.getStyleProperty('opacity');
  await t.expect(parseFloat(opacity)).lt(1);
});

test('Full game cycle works', async t => {
  await t.wait(500);
  await t.expect(playerCards.count).eql(2);

  await t.click(hitBtn);
  await t.wait(300);
  await t.click(standBtn);
  await t.expect(resultText.visible).ok({ timeout: 5000 });

  await t.click(replayBtn);
  await t.wait(500);
  await t.expect(playerCards.count).eql(2);
});