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

/* Lists every card or button that sticks out past either side of the viewport */
const elementsOutsideViewport = ClientFunction(() => {
  const width = document.documentElement.clientWidth;
  return Array.from(document.querySelectorAll('#yourcards img, #casscards img, #click button'))
    .filter(element => {
      const box = element.getBoundingClientRect();
      return box.left < 0 || box.right > width;
    })
    .map(element => element.id || element.getAttribute('src'));
});

/* Splits the welcome into the lines the reader sees, since the browser wraps it as one block of text. Only the words
   are measured, never the spaces, so a space stretched to fill a line shows up as a wider gap between two words */
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
      line.gaps.push(box.left - line.right);
      line.words.push(match[0]);
      line.right = box.right;
    } else {
      lines.push({ top: box.top, right: box.right, words: [match[0]], gaps: [] });
    }
  }
  return lines;
};

const welcomeLineCount = ClientFunction(() => readWelcomeLines().length, { dependencies: { readWelcomeLines } });

const welcomeLineTexts = ClientFunction(() => readWelcomeLines().map(line => line.words.join(' ')), { dependencies: { readWelcomeLines } });

/* How much wider the widest gap between two words is than the narrowest, in ems so it reads the same at every text
   size: kerning moves a space by a few hundredths of an em, while justifying a line opens its gaps by half an em or more */
const welcomeGapSpread = ClientFunction(() => {
  const gaps = readWelcomeLines().flatMap(line => line.gaps);
  const fontSize = parseFloat(getComputedStyle(document.getElementById('wmessage')).fontSize);
  return (Math.max(...gaps) - Math.min(...gaps)) / fontSize;
}, { dependencies: { readWelcomeLines } });

/* How far the welcome text reaches past any edge of the header that holds it, where anything above zero means it has spilled out */
const welcomeSpill = ClientFunction(() => {
  const welcome = document.getElementById('wmessage').getBoundingClientRect();
  const header = document.getElementById('header').getBoundingClientRect();
  return Math.max(header.top - welcome.top, welcome.bottom - header.bottom, header.left - welcome.left, welcome.right - header.right, 0);
});

fixture('Responsive layout')
  .page(BASE_URL)
  .clientScripts(dealFrom(PLAYER_WINS));

SCREENS.forEach(({ name, width, height }) => {
  test(`fits every card and button across a ${name} screen (${width}x${height})`, async t => {
    await t.resizeWindow(width, height);
    await table.waitForPlayerTurn();

    await t.expect(elementsOutsideViewport()).eql([]);
  });

  test(`sets the welcome at normal word spacing inside the header on a ${name} screen (${width}x${height})`, async t => {
    await t
      .resizeWindow(width, height)
      .navigateTo(BASE_URL);

    await t
      .expect(welcomeLineCount()).gt(1)
      .expect(welcomeGapSpread()).lte(0.15)
      .expect(welcomeSpill()).eql(0);
  });
});

/* A resized window has to end up with the same welcome lines as a page opened at that size, whichever way the window moved */
[
  { direction: 'narrows', from: [1280, 800], to: [320, 568] },
  { direction: 'widens', from: [320, 568], to: [1280, 800] }
].forEach(({ direction, from, to }) => {
  test(`rebuilds the welcome lines when the window ${direction} from ${from.join('x')} to ${to.join('x')}`, async t => {
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