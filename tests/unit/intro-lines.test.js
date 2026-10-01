import { evenLineBreaks } from '../../src/21.js';

/* Word widths and the space between words are plain numbers here, so every expected split can be worked out by hand */
QUnit.module('evenLineBreaks', () => {
  QUnit.test('keeps words that fit on one line together', assert => {
    assert.deepEqual(evenLineBreaks([10, 10, 10], 1, 100), [[0, 3]]);
  });

  /* Filling the first line would leave 39 and 19, while three words and two words make two lines of 29 */
  QUnit.test('moves a break so the lines come out even instead of filling the first line', assert => {
    assert.deepEqual(evenLineBreaks([9, 9, 9, 9, 19], 1, 40), [[0, 3], [3, 5]]);
  });

  QUnit.test('never lets a line run past the width', assert => {
    assert.deepEqual(evenLineBreaks([9, 9, 9, 9, 19], 1, 28), [[0, 2], [2, 4], [4, 5]]);
  });

  QUnit.test('gives a word wider than the limit a line of its own', assert => {
    assert.deepEqual(evenLineBreaks([10, 50, 10], 1, 30), [[0, 1], [1, 2], [2, 3]]);
  });

  QUnit.test('returns no lines when there are no words', assert => {
    assert.deepEqual(evenLineBreaks([], 1, 100), []);
  });

  /* Two lines leave a lone word 9 short of the first line, which no gap can make up, while three lone words differ by only 2 */
  QUnit.test('uses an extra line when the height allows it and the lines get far more even', assert => {
    assert.deepEqual(evenLineBreaks([10, 10, 12], 1, 23), [[0, 2], [2, 3]]);
    assert.deepEqual(evenLineBreaks([10, 10, 12], 1, 23, 3), [[0, 1], [1, 2], [2, 3]]);
  });

  QUnit.test('keeps the fewest lines when an extra one would not make them any more even', assert => {
    assert.deepEqual(evenLineBreaks([9, 9, 9, 9, 19], 1, 40, 3), [[0, 3], [3, 5]]);
  });
});