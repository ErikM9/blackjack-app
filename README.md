# Twenty-One

![CI](https://github.com/ErikM9/blackjack-app/actions/workflows/ci.yml/badge.svg)

A Blackjack game with a fantasy theme and jQuery animations. You play against Cassius, the arcane automaton of Archmage Volans, and whoever gets closer to 21 without going over wins the round.

**Live demo:** [erikm9.github.io/blackjack-app](https://erikm9.github.io/blackjack-app/)

## Run it

```bash
npm install
npm run serve
```

Then open http://localhost:3000. jQuery is served from `src/vendor/` instead of a CDN, so the game also works offline, with only its display font falling back to the system's.

## Testing

I used QUnit for the unit tests and TestCafe for the end-to-end tests. c8 asks for Node 20.19 or 22.12 or newer.

```bash
npm test                    # unit tests
npm run test:coverage       # unit tests with a coverage report (fails below 90%)
npm run test:e2e:headless   # e2e tests in headless Chrome
npm run test:e2e            # e2e tests in a visible Chrome window
npm run test:e2e:all        # e2e tests in Chrome and Firefox
```

The e2e suite starts its own server on port 3100 (see `.testcaferc.json`), so you don't need to run `npm run serve` first. If a test fails, a screenshot of it is saved to `tests/e2e/screenshots/`.

### Why these tools?

I chose the testing tools for my smaller projects so I could learn how various testing tools work, which is why each of them uses a different set. For Twenty-One I went with QUnit, Sinon, c8, TestCafe and axe-core.

- QUnit is lightweight, needs no configuration and works with ES modules straight away, and `QUnit.test.each` keeps the tables of scoring and result rules short and easy to read.
- Sinon stubs `Math.random` and the deck and spies on the game's callbacks, so every unit test deals cards I know in advance and can check exactly what the game reported.
- c8 measures the coverage of the unit tests straight from V8, so there is no build step, and it fails the run when coverage drops below 90%.
- TestCafe drives Chrome and Firefox without any WebDriver setup. It can run a script in the page before the game loads, which is how the deals get rigged, and it keeps retrying its assertions until the page catches up, so the tests need no fixed waits.
- axe-core runs automated WCAG 2.1 A and AA scans inside the e2e suite.

### Rigged deals

Blackjack is random, and a test which depends on luck is not worth much. That is why both suites rig the deck:

- The unit tests replace the game's `initDeck` with a deck I scripted myself (`tests/unit/support/rigged-game.js`).
- The e2e tests inject a script before the page loads, which takes over only the `Math.random` calls made by `shuffleDeck`. This way each test can deal a named hand such as `PLAYER_WINS` or `BUST_ON_HIT` (`tests/e2e/support/deals.js`).

### What's tested

**Unit (71 tests, 100% coverage of the game logic)**
- Building the deck, with an image file for every card, and the Fisher-Yates shuffle
- Scoring, including Aces which switch from 11 to 1
- The Blackjack, bust and dealer rules at their boundaries (21/22, 16/17, soft 17)
- Who wins a round, including a natural Blackjack beating a 21 made with more cards
- Result messages, emojis and card names
- A full round in `BlackjackGame`: deal, hit, stand, auto-stand, callbacks and state

**End-to-end (36 tests)**
- Page load: the welcome, the dealt cards, the face-down hole card and the scores
- Gameplay: hit, stand, bust, auto-stand on 21, natural Blackjack and replay
- Round results: the win, lose and draw messages and their effects
- Responsive layout from 320px phones to desktop, with the welcome text staying inside the header and wrapping again when the window is resized, and the whole page fitting short laptop windows
- Accessibility: axe scans, alt text for the cards, a hole card which stays hidden from screen readers until it is turned over, labelled hands, score announcements and keyboard focus

## Project structure

```
src/
  21.js, 21.css, index.html   game logic, styles and page
  cards/, archmage.png        images
  vendor/                     jQuery
tests/
  unit/                       rules.test.js, blackjack-game.test.js
  unit/support/               rigged deck for the unit tests
  e2e/                        page-load, gameplay, round-results, responsive, accessibility
  e2e/support/                page model, rigged deals and named hands
```

## CI

GitHub Actions runs the unit tests with coverage and the e2e suite in Chrome and Firefox on every push and pull request to `main`. A push to `main` which passes them is then deployed to GitHub Pages, straight from `src/`.