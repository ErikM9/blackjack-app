export const SUITS = ['spade', 'club', 'heart', 'diamond'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function buildDeck(suits = SUITS, ranks = RANKS) {
  return suits.flatMap(s => ranks.map(r => `${r}-${s}`));
}

/* Fisher-Yates shuffle without mutating the original deck */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const getRank = card => card.split('-')[0];

function getRankValue(rank) {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/* Aces count as 11 unless reducing them to 1 prevents a bust */
export function calculateScore(hand) {
  let total = 0, aces = 0;

  for (const card of hand) {
    const r = getRank(card);
    total += getRankValue(r);
    if (r === 'A') aces++;
  }

  while (aces > 0 && total > 21) {
    total -= 10;
    aces--;
  }

  return total;
}

export const isBlackjack = hand => hand.length === 2 && calculateScore(hand) === 21;
export const isBust = hand => calculateScore(hand) > 21;

export function determineWinner(playerHand, dealerHand) {
  const ps = calculateScore(playerHand);
  const ds = calculateScore(dealerHand);

  if (ps > 21) return 'lose';
  if (ds > 21) return 'win';

  return ps > ds ? 'win' : ps < ds ? 'lose' : 'draw';
}

/* Dealer draws until reaching 17 or higher */
export const shouldDealerHit = hand => calculateScore(hand) < 17;

export function getResultMessage(result) {
  if (result === 'win') return "Impressive! Well... I guess I'll have to keep my word. Come on, I'll show you the treasure.";
  if (result === 'lose') return "Out of luck, are we? No need to worry, you'll only be a frog for a day...";
  return "Hmmm... A draw... This is a most unexpected outcome!";
}

export const getResultEmoji = result =>
  ({ win: '😃', lose: '😢', draw: '😐' })[result] || '😐';

export class BlackjackGame {
  constructor(options = {}) {
    this.deck = [];
    this.playerHand = [];
    this.dealerHand = [];
    this.gameActive = false;
    this.result = null;

    /* UI hooks / callbacks */
    this.onUpdate = options.onUpdate || null;
    this.onResult = options.onResult || null;
    this.onPlayerCard = options.onPlayerCard || null;
    this.onDealerCard = options.onDealerCard || null;
  }

  initDeck() {
    this.deck = shuffleDeck(buildDeck());
  }

  /* Reinitialise deck if exhausted */
  drawCard() {
    if (!this.deck.length) this.initDeck();
    return this.deck.pop();
  }

  deal() {
    this.initDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.result = null;
    this.gameActive = true;

    this.playerHand.push(this.drawCard(), this.drawCard());
    this.dealerHand.push(this.drawCard(), this.drawCard());

    if (this.onUpdate) this.onUpdate(this.getState());

    /* Natural blackjack resolves immediately */
    if (isBlackjack(this.playerHand)) this.stand();
  }

  hit() {
    if (!this.gameActive) return;

    const card = this.drawCard();
    this.playerHand.push(card);

    if (this.onPlayerCard) this.onPlayerCard(card);
    if (this.onUpdate) this.onUpdate(this.getState());

    if (isBust(this.playerHand)) {
      this.endGame('lose');
    } else if (calculateScore(this.playerHand) === 21) {
      /* Auto-stand on 21 */
      this.stand();
    }
  }

  stand() {
    if (!this.gameActive) return;

    while (shouldDealerHit(this.dealerHand)) {
      const card = this.drawCard();
      this.dealerHand.push(card);

      if (this.onDealerCard) this.onDealerCard(card);
    }

    this.endGame(determineWinner(this.playerHand, this.dealerHand));
  }

  endGame(result) {
    this.gameActive = false;
    this.result = result;

    if (this.onUpdate) this.onUpdate(this.getState());
    if (this.onResult) this.onResult(result);
  }

  /* Hide dealer hole card until the round ends */
  getState() {
    return {
      playerHand: [...this.playerHand],
      dealerHand: [...this.dealerHand],
      playerScore: calculateScore(this.playerHand),
      dealerScore: this.gameActive
        ? calculateScore([this.dealerHand[1]])
        : calculateScore(this.dealerHand),
      gameActive: this.gameActive,
      result: this.result,
      deckSize: this.deck.length
    };
  }
}

/* --- Browser UI --- */
if (typeof window !== 'undefined' && typeof $ !== 'undefined') {
  let magicTimeout;
  let revealBadges = false;

  const addCard = (id, c) => $(`#${id}`).append($('<img>', {
    src: `cards/${c}.png`,
    css: { opacity: 0, transform: 'scale(.9)', transition: 'opacity .3s,transform .3s' }
  }).on('load', function () {
    this.style.opacity = 1;
    this.style.transform = 'scale(1)';

    if (revealBadges) {
      revealBadges = false;
      requestAnimationFrame(() =>
        $('.score-badge').css({ transition: 'opacity .3s ease', opacity: 1 })
      );
    }

    setTimeout(() => {
      this.style.transition = 'none';
    }, 300);
  }));

  /* Dealer hole card starts face-down */
  const hiddenCard = (id, c) => $(`#${id}`).append(`
    <div class="card-container flippable">
      <div class="card">
        <div class="card-back"><img src="cards/back.png"></div>
        <div class="card-front"><img src="cards/${c}.png"></div>
      </div>
    </div>`);

  /* Reveal hidden dealer card */
  const reveal = () => $('.flippable .card').css('transform', 'rotateY(180deg)');

  const magic = t => {
    if (magicTimeout) clearTimeout(magicTimeout);

    const eff = $('#magic-effect').empty();

    for (let i = 0; i < 20; i++) {
      eff.append($('<div class="magic-orb">').text(getResultEmoji(t)).css({
        left: `${Math.random() * 100}vw`,
        top: `${Math.random() * 100}vh`,
        animationDelay: `${Math.random() * 2}s`,
      }));
    }

    /* Remove particles after animation */
    magicTimeout = setTimeout(() => eff.empty(), 5000);
  };

  const message = result => {
    $('#wmessage').fadeTo(200, 0);
    $('#result')
      .text(getResultMessage(result))
      .css({ visibility: 'visible' })
      .delay(200)
      .fadeTo(300, 1);

    magic(result);

    $('#hit,#stand').prop('disabled', true);
    $('#replay').prop('disabled', false);
  };

  const game = new BlackjackGame({
    onUpdate(state) {
      $('#cassius span').text(state.dealerScore);
      $('#you span').text(state.playerScore);
    },

    onPlayerCard(card) {
      addCard('yourcards', card);
    },

    onDealerCard(card) {
      addCard('casscards', card);
    },

    onResult(result) {
      reveal();
      $('#cassius span').text(calculateScore(game.dealerHand));
      message(result);
    }
  });

  /* Reset board and start a new round */
  const reset = () => {
    $('#hit,#stand,#replay').prop('disabled', true);

    if (magicTimeout) clearTimeout(magicTimeout);

    $('#magic-effect').empty();
    $('#yourcards,#casscards').empty();

    $('.score-badge').css({
      transition: 'none',
      opacity: 0
    });

    revealBadges = true;

    $('#result').stop(true, true)
      .css({ opacity: 0, visibility: 'hidden' })
      .text('');

    $('#wmessage').stop(true, true).css('opacity', 1);
    $('#cassius span,#you span').text('0');

    /* Temporarily detach callbacks during initial deal */
    game.onDealerCard = null;
    game.onResult = null;

    game.deal();

    game.onDealerCard = card => addCard('casscards', card);
    game.onResult = result => {
      reveal();
      $('#cassius span').text(calculateScore(game.dealerHand));
      message(result);
    };

    const state = game.getState();

    state.playerHand.forEach(c => addCard('yourcards', c));
    hiddenCard('casscards', state.dealerHand[0]);
    addCard('casscards', state.dealerHand[1]);

    /* Handle instant blackjack */
    if (!game.gameActive) {
      state.dealerHand.slice(2).forEach(c => addCard('casscards', c));
      reveal();
      $('#cassius span').text(calculateScore(game.dealerHand));
      message(state.result);
    } else {
      $('#cassius span').text(state.dealerScore);
      $('#you span').text(state.playerScore);
      setTimeout(() => $('#hit,#stand,#replay').prop('disabled', false), 250);
    }
  };

  $(function () {
    $('#hit').click(() => {
      if (game.gameActive) game.hit();
    });

    $('#stand').click(() => {
      if (game.gameActive) game.stand();
    });

    $('#replay').click(reset);

    /* Preload card dimensions to prevent layout shift */
    const probe = new Image();

    const begin = () => {
      if (probe.naturalWidth) {
        document.documentElement.style.setProperty(
          '--card-aspect',
          probe.naturalHeight / probe.naturalWidth
        );
      }

      reset();

      /* Fade in once initial layout is stable */
      requestAnimationFrame(() => $('#game').css('opacity', 1));
    };

    probe.onload = begin;
    probe.onerror = begin;
    probe.src = 'cards/back.png';
  });
}