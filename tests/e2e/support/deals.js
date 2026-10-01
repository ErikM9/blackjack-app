/* Hands are listed in deal order: the player's two cards, then the dealer's hole card and face-up card, then any draws */

/* Player 19 stands against a dealer 17 showing a Queen */
export const PLAYER_WINS = { player: ['K-spade', '9-heart'], dealer: ['7-club', 'Q-diamond'] };

/* Player 17 stands against a dealer 19 showing a 9 */
export const PLAYER_LOSES = { player: ['10-spade', '7-heart'], dealer: ['K-club', '9-diamond'] };

/* Both hands make 18 */
export const DRAW = { player: ['K-spade', '8-heart'], dealer: ['Q-club', '8-diamond'] };

/* Player 11 hits a 3 and the round goes on */
export const SAFE_HIT = { player: ['5-spade', '6-heart'], dealer: ['10-club', '7-diamond'], next: ['3-club'] };

/* Player 16 hits a Queen and busts */
export const BUST_ON_HIT = { player: ['K-spade', '6-heart'], dealer: ['10-club', '7-diamond'], next: ['Q-heart'] };

/* Player 11 hits a King for exactly 21 against a dealer 17 */
export const HIT_TO_21 = { player: ['9-spade', '2-heart'], dealer: ['10-club', '7-diamond'], next: ['K-heart'] };

/* Player 18 stands and the dealer draws from 16 to 25 */
export const DEALER_BUSTS = { player: ['10-spade', '8-heart'], dealer: ['10-club', '6-diamond'], next: ['9-heart'] };

/* A natural blackjack settles the round before any button is pressed */
export const NATURAL_BLACKJACK = { player: ['A-spade', 'K-heart'], dealer: ['10-club', '7-diamond'] };