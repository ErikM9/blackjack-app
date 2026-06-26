# Twenty-One

![CI](https://github.com/ErikM9/blackjack-app/actions/workflows/ci.yml/badge.svg)

Blackjack game with jQuery animations and a fantasy theme.

## Run it

```bash
npm install
npm run serve
```

Note: You'll need a `cards/` folder in `src/` with card images named like `A-spade.png`, `K-heart.png`, etc., plus `back.png` for the hidden card.

## Testing

Unit tests with QUnit, E2E tests with TestCafe.

```bash
npm test                 # unit tests
npm run test:e2e         # e2e tests (needs npm run serve first)
```

### Why these tools?

- **QUnit** — Lightweight, zero-config, and works out of the box with ES modules. The unit tests cover pure game logic with no browser dependencies, so the simplicity is a good fit.
- **TestCafe** — No WebDriver setup required; async/await test syntax handles the timing of card animations and DOM updates cleanly.

### What's tested

**Unit (40 tests)**
- Deck building and shuffling
- Score calculation with Ace logic (11 or 1)
- Win/lose/draw determination
- Dealer hit rules (stands on 17)
- Result messages, emojis, and colours
- BlackjackGame class (deal, hit, stand, callbacks, state)

**E2E (41 specs)**
- Game flow (deal, hit, stand, replay)
- Card flip animation
- Button state management
- Score updates
- Result messages
- Accessibility (aria-live on scores and result, aria-labels, alt text)
- Mobile responsiveness

## CI

GitHub Actions runs both test suites on push.