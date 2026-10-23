import { Selector, t } from 'testcafe';

/* A dedicated port keeps the suite from ever testing a dev server someone left running on 3000 */
export const BASE_URL = 'http://localhost:3100';

/* Matches a card image's src whether the browser reports the relative path (Chrome) or the resolved URL (Firefox) */
export const cardImage = card => new RegExp(`(^|/)cards/${card}\\.png$`);

/* Finds the page only once the table has stopped fading and flipping */
const tableAtRest = Selector(() => {
  const opaque = Array.from(document.querySelectorAll('#game, .score-badge, #yourcards img, #casscards > img'))
    .every(element => getComputedStyle(element).opacity === '1');
  const moving = document.getAnimations().some(animation => animation instanceof CSSTransition) || $(':animated').length > 0;
  return opaque && !moving ? document.body : null;
});

/* Page model for the card table, exposing elements and player actions while every assertion stays in the specs */
class Table {
  constructor() {
    this.welcome = Selector('#wmessage');
    this.archmage = Selector('#header img');
    this.result = Selector('#result');
    this.playerHand = Selector('#you');
    this.dealerHand = Selector('#cassius');
    this.playerScore = Selector('#you .score-badge span');
    this.dealerScore = Selector('#cassius .score-badge span');
    this.playerScoreRegion = Selector('#you .score-badge');
    this.dealerScoreRegion = Selector('#cassius .score-badge');
    this.playerCards = Selector('#yourcards img');
    this.dealerFaceUpCards = Selector('#casscards > img');
    this.holeCard = Selector('#casscards .flippable .card');
    this.holeCardBack = Selector('#casscards .flippable .card-back img');
    this.holeCardFront = Selector('#casscards .flippable .card-front img');
    this.hitButton = Selector('#hit');
    this.standButton = Selector('#stand');
    this.replayButton = Selector('#replay');
    this.orbs = Selector('#magic-effect .magic-orb');
    this.sparks = Selector('.spark');
    this.focusedElement = Selector(() => document.activeElement);
  }

  /* Waits for the dealt cards and then for Hit to unlock, since the buttons are locked while the cards are dealt */
  async waitForPlayerTurn() {
    await this.playerCards.nth(1)();
    await Selector('#hit:not([disabled])')();
  }

  /* The score badges can still be fading in after Hit unlocks, so checks on how the table looks wait for this */
  async waitUntilStill() {
    await tableAtRest();
  }

  async hit() {
    await this.waitForPlayerTurn();
    await t.click(this.hitButton);
  }

  async stand() {
    await this.waitForPlayerTurn();
    await t.click(this.standButton);
  }

  async replay() {
    await t.click(Selector('#replay:not([disabled])'));
  }
}

export default new Table();