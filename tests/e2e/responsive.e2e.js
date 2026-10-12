import { ClientFunction } from 'testcafe';
import table, { BASE_URL } from './support/table.js';
import { dealFrom } from './support/rigged-deal.js';
import { getResultMessage } from '../../src/21.js';
import { PLAYER_WINS } from './support/deals.js';

const SCREENS = [
  { name: 'small phone', width: 320, height: 568 },
  { name: 'phone', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 }
];

/* Lists the table and every card or button that sticks out past either side of the viewport */
const elementsOutsideViewport = ClientFunction(() => {
  const width = document.documentElement.clientWidth;
  return Array.from(document.querySelectorAll('#card-table, #yourcards img, #casscards img, #click button'))
    .filter(element => {
      const box = element.getBoundingClientRect();
      return box.left < 0 || box.right > width;
    })
    .map(element => element.id || element.getAttribute('src'));
});

/* Splits the welcome into the lines the reader sees by grouping its words on their vertical position */
const readWelcomeLines = () => {
  const text = document.getElementById('wmessage').firstChild;
  const lines = [];
  const words = /\S+/g;
  let match;
  while ((match = words.exec(text.data))) {
    const word = document.createRange();
    word.setStart(text, match.index);
    word.setEnd(text, match.index + match[0].length);
    const box = word.getBoundingClientRect();
    const line = lines[lines.length - 1];
    if (line && Math.abs(box.top - line.top) < box.height / 2) {
      line.words.push(match[0]);
    } else {
      lines.push({ top: box.top, words: [match[0]] });
    }
  }
  return lines;
};

const welcomeLineCount = ClientFunction(() => readWelcomeLines().length, { dependencies: { readWelcomeLines } });

const welcomeLineTexts = ClientFunction(() => readWelcomeLines().map(line => line.words.join(' ')), { dependencies: { readWelcomeLines } });

/* How far the welcome text spills past any edge of the header, which is zero when it fits */
const welcomeSpill = ClientFunction(() => {
  const welcome = document.getElementById('wmessage').getBoundingClientRect();
  const header = document.getElementById('header').getBoundingClientRect();
  return Math.max(header.top - welcome.top, welcome.bottom - header.bottom, header.left - welcome.left, welcome.right - header.right, 0);
});

fixture('Responsive layout')
  .page(BASE_URL)
  .clientScripts(dealFrom(PLAYER_WINS))
  .afterEach(async t => {
    await t.resizeWindow(1280, 800);
  });

SCREENS.forEach(({ name, width, height }) => {
  test(`fits the table, cards and buttons across a ${name} screen (${width}x${height})`, async t => {
    await t.resizeWindow(width, height);
    await table.waitForPlayerTurn();

    await t.expect(elementsOutsideViewport()).eql([]);
  });

  test(`keeps the welcome inside the header on a ${name} screen (${width}x${height})`, async t => {
    await t
      .resizeWindow(width, height)
      .navigateTo(BASE_URL);

    await t
      .expect(welcomeLineCount()).gt(1)
      .expect(welcomeSpill()).eql(0);
  });
});

/* A resized window has to end up with the same welcome lines as a page opened at that size */
[
  { direction: 'narrows', from: [1280, 800], to: [320, 568] },
  { direction: 'widens', from: [320, 568], to: [1280, 800] }
].forEach(({ direction, from, to }) => {
  test(`refits the welcome when the window ${direction} from ${from.join('x')} to ${to.join('x')}`, async t => {
    await t
      .resizeWindow(...to)
      .navigateTo(BASE_URL)
      .expect(welcomeLineCount()).gt(1);

    const linesOpenedAtSize = await welcomeLineTexts();

    await t
      .resizeWindow(...from)
      .navigateTo(BASE_URL)
      .expect(welcomeLineCount()).gt(1)
      .resizeWindow(...to)
      .expect(welcomeLineTexts()).eql(linesOpenedAtSize);
  });
});

test('plays a round through to the result on the smallest screen', async t => {
  await t.resizeWindow(320, 568);

  await table.stand();

  await t.expect(table.result.innerText).eql(getResultMessage('win'));
});