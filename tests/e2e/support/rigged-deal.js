import { buildDeck } from '../../../src/21.js';

/* Works out the Math.random values that make shuffleDeck's Fisher-Yates pass leave the given cards on top, in draw order */
function randomValuesFor(drawOrder) {
  const deck = buildDeck();
  const values = [];

  for (let i = deck.length - 1; i > 0; i--) {
    const wanted = drawOrder[deck.length - 1 - i];
    const j = wanted === undefined ? i : deck.indexOf(wanted);
    if (j < 0 || j > i) throw new Error(`Cannot deal ${wanted}: it is not a card or it appears twice`);
    values.push((j + 0.5) / (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return values;
}

/* Client script that rigs only the Math.random calls coming from shuffleDeck, found via the call stack, so sparks, orbs and TestCafe itself keep real randomness */
export function dealFrom(...rounds) {
  const sequences = rounds.map(({ player, dealer, next = [] }) => randomValuesFor([...player, ...dealer, ...next]));

  return {
    content: `(() => {
      const sequences = ${JSON.stringify(sequences)};
      const perShuffle = sequences[0].length;
      const realRandom = Math.random.bind(Math);
      let calls = 0;
      Math.random = () => {
        if (!new Error().stack.includes('shuffleDeck')) return realRandom();
        const sequence = sequences[Math.floor(calls / perShuffle) % sequences.length];
        return sequence[calls++ % perShuffle];
      };
    })();`
  };
}