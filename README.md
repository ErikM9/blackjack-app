# Twenty-One

![CI](https://github.com/ErikM9/blackjack-app/actions/workflows/ci.yml/badge.svg)

Blackjack game with jQuery animations and a fantasy theme.

## Run it

```bash
npm install
npm run serve
```

Then open http://localhost:3000. jQuery is served from `src/vendor/`, so the game also works offline and on networks that block Google's CDN.

## Testing

Unit tests with QUnit, end-to-end tests with TestCafe.

```bash
npm test                    # unit tests
npm run test:coverage       # unit tests with a coverage report (fails below 90%)
npm run test:e2e:headless   # e2e tests in headless Chrome
npm run test:e2e            # e2e tests in a visible Chrome window
npm run test:e2e:all        # e2e tests in Chrome and Firefox
```

The e2e suite starts its own server on port 3100 (see `.testcaferc.json`), so there is no need to run `npm run serve` first. Screenshots of failing tests are saved to `tests/e2e/screenshots/`.

### Why these tools?

- **QUnit** — Lightweight, zero-config, and works out of the box with ES modules. `QUnit.test.each` keeps the rule tables short and readable.
- **Sinon** — Stubs `Math.random` and the deck, so every unit test deals known cards.
- **c8** — Coverage from V8's built-in instrumentation, with no build step.
- **TestCafe** — No WebDriver setup required, and its assertions retry until the page catches up, so the suite needs no fixed waits.
- **axe-core** — Automated WCAG 2.1 A and AA scans inside the e2e suite.

### Deterministic deals

Blackjack is random, and a test that depends on luck either skips its checks or passes without testing anything. Both suites therefore rig the deck:

- Unit tests replace the game's `initDeck` with a scripted deck (`tests/unit/support/rigged-game.js`).
- E2E tests inject a script before the page loads that controls only the `Math.random` calls made by `shuffleDeck`, so each test deals a named hand such as `PLAYER_WINS` or `BUST_ON_HIT` (`tests/e2e/support/deals.js`).

### What's tested

**Unit (75 tests, 100% coverage of the game logic)**
- Deck building and Fisher-Yates shuffling
- Scoring, including Aces that switch from 11 to 1
- Blackjack, bust and dealer rules at their boundaries (21/22, 16/17, soft 17)
- Winner rules, including a natural blackjack beating a 21 made with more cards
- Result messages, emojis and card names
- The `BlackjackGame` round: deal, hit, stand, auto-stand, callbacks and state
- Line breaking for the welcome text: even lines, width limits, over-long words, and extra lines only when they spread the words more evenly

**E2E (33 specs)**
- Page load: welcome, dealt cards, face-down hole card and scores
- Gameplay: hit, stand, bust, auto-stand on 21, natural blackjack and replay
- Round results: win, lose and draw messages and effects
- Responsive layout from 320px phones to desktop, with the welcome text set in lines of equal length that are rebuilt when the window is resized
- Accessibility: axe scans once every fade has finished, card alt text, a hole card that stays hidden from screen readers until it is turned over, labelled hands, score announcements and keyboard focus

## Project structure

```
src/
  21.js, 21.css, index.html   game logic, styles and page
  cards/, archmage.png        images
  vendor/                     self-hosted jQuery
tests/
  unit/                       rules.test.js, blackjack-game.test.js, intro-lines.test.js
  unit/support/               rigged deck for unit tests
  e2e/                        page-load, gameplay, round-results, responsive, accessibility
  e2e/support/                page model, rigged deals and named hands
```

## CI

GitHub Actions runs the unit tests with coverage, and the e2e suite in Chrome and Firefox, on every push and pull request.