/*
 *  Copyright (C) 2011-2012 Wilson Pinto Júnior <wilsonpjunior@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


var CARDS = [['J', 0, 0],
             ['J', 1, 0],
             ['J', 2, 0],
             ['J', 3, 0],
             ['Q', 0, 1],
             ['Q', 1, 1],
             ['Q', 2, 1],
             ['Q', 3, 1],
             ['K', 0, 2],
             ['K', 1, 2],
             ['K', 2, 2],
             ['K', 3, 2],
             ['A', 0, 3],
             ['A', 1, 3],
             ['A', 2, 3],
             ['2', 0, 4],
             ['2', 1, 4],
             ['2', 2, 4],
             ['2', 3, 4],
             ['3', 0, 5],
             ['3', 1, 5],
             ['3', 2, 5],
             ['3', 3, 5],
             ['7', 1, 6],
             ['A', 3, 7],
             ['7', 0, 8],
             ['4', 2, 9]
];

function getCards(players, cards) {

    if (players == undefined)
        var players = 4;

    if (cards == undefined)
        var cards = 3;

    var allCards = [];

    for (i=0; i<CARDS.length; i+=1)
        allCards.push(i);

    function generateCards() {
        var selectedCards = [];
        for (i=0; i<cards; i+=1) {
            var selectedCardNum = Math.floor(Math.random()*allCards.length);
            selectedCards.push(allCards[selectedCardNum]);
            allCards.splice(selectedCardNum, 1);
        }
        return selectedCards;
    }
    
    var playerCards = [];

    for (j=0; j<players; j+=1) {
        playerCards.push(generateCards());
    }
    
    return playerCards;
}

function getCard (cardId, normalized) {
    if (normalized == undefined)
        normalized = false;

    var card = CARDS[cardId];

    if (normalized)
        return card[0]+card[1];

    return card
}

this.getCard = getCard;
this.getCards = getCards;
this.CARDS = CARDS;
