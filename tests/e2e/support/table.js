import { Selector, t } from 'testcafe';

/* A dedicated port keeps the suite from ever testing a dev server someone left running on 3000 */
export const BASE_URL = 'http://localhost:3100';

/* Matches a card image's src however the browser reports it: Chrome gives back the relative path the app set, Firefox the resolved URL */
export const cardImage = card => new RegExp(`(^|/)cards/${card}\\.png$`);

/* Finds the page only once the table has stopped fading and flipping, since text caught halfway through a fade is part see-through */
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

  /* The buttons start enabled in the HTML, are locked while the cards are dealt and unlock a moment later, so this waits for the dealt cards before waiting for Hit */
  async waitForPlayerTurn() {
    await this.playerCards.nth(1)();
    await Selector('#hit:not([disabled])')();
  }

  /* The score badges fade in after the first card loads, which can end after Hit is already unlocked, so checks on how the table looks wait for this */
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