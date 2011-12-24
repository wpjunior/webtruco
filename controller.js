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

var util = require("util");
var events = require('events');
var cards = require('./cards.js');

var lastGameId = 0;

var Player = function (socket) {
    events.EventEmitter.call(this);
    this._init(socket);
}

util.inherits(Player, events.EventEmitter);

Player.prototype._init = function(socket) {
    var me = this;
    
    this.socket = socket;
    this.num = -1;
    this.nick = null;
    this.cards = [];
    this.time = -1;
    this.myCoup = false;
    
    socket.on('nickchanged', function (nick) {
        me.nick = nick;
        me.emit('nickchanged', nick);
    });

    socket.on('coup', function (num) {
        if (num >= me.cards.length)
            return;

        var cd = me.cards.splice(num, 1);

        me.emit('coup', cd[0]);
        me.sendCards();
    });

    socket.on('disconnect', function () {
        me.emit('disconnect');
    });
}

Player.prototype.sendCards = function () {
    var namedCards = [];
    
    this.cards.forEach(function (cardId) {
        namedCards.push(cards.getCard(cardId, true));
    });

    this.socket.emit("setPlayerCards", namedCards);
}

Player.prototype.setCards = function (c) {
    this.cards = c;
    this.sendCards();
}

Player.prototype.setNumber = function (num) {
    this.num = num;
    this.socket.emit("setPlayerNum", num);
};

Player.prototype.gameStarted = function () {
    this.socket.emit("gameStarted");
};


Player.prototype.endGame = function (reason) {
    this.socket.emit("endGame", reason);
    this.removeAllListeners();
    this.socket.disconnect();
}

Player.prototype.join = function (gameId) {
    this.socket.join(gameId.toString());
    this.socket.emit('join', gameId);
}

Player.prototype.getTime = function () {
    return this.num % 2;
}

var Game = function (mainSocket) {
    events.EventEmitter.call(this);
    
    this.players = [];
    this.closed = false;
    this.online = true;
    this.created = new Date();
    this.playerCoup = -1;
    this.table = [];
    this.mainSocket = mainSocket;

    this.rounds = [];

    lastGameId++;
    this.id = lastGameId;
};

util.inherits(Game, events.EventEmitter);

Game.prototype.pushCard = function (cardNum, pNum) {

    if (this.table.length == 4)
        this.table = [];

    this.table.push([cardNum, pNum]);
    this.table.sort(function (c1, c2) {
        var v1 = cards.getCardValue(c1[0]);
        var v2 = cards.getCardValue(c2[0]);

        return v2 - v1;
    });

    if (this.table.length == 4)
        this.nextRound();
    else 
        this.nextCoup();
    
};

Game.prototype.addPlayer = function (p) {
    var me = this;

    if (this.closed)
        throw "This Game is Closed"

    p.join(this.id);

    this.players.push(p);
    p.setNumber(this.players.indexOf(p));

    p.on('nickchanged', function (nick) {
        console.info('nickchanged', nick);
    });

    p.on('coup', function (cardNum) {
        me.pushCard(cardNum, p.num);
        me.sendPlayerCoups();
    });

    p.on('disconnect', function () {
        if (this.online)
            this.endGame("Jogador "+this.num+" desconectou");
    });

    if (this.players.length == 4) {
        this.closed = true;
        this.startGame();
    }
};

Game.prototype.nextCoup = function () {
    if (this.playerCoup == 0)
        this.playerCoup = 3;
    else
        this.playerCoup -= 1;
};

Game.prototype.nextRound = function () {
    var _this = this;

    var maxCard = this.table[0][0];
    var maxCardPlayer = this.table[0][1];
    var maxCardValue = cards.getCardValue(this.table[0][0]);
    var maxCardTime = this.players[maxCardPlayer].getTime();

    // empate de cartas
    if ((maxCardValue==cards.getCardValue(this.table[1][0]))&&
        (maxCardTime!=this.players[this.table[1][1]].getTime())) {

        this.rounds.push(-1);
        this.nextCoup();
    } else {
        this.rounds.push(maxCardTime);
        this.playerCoup = maxCardPlayer;
    }
    
    var b = this.getBroadcast();
    b.emit('setRounds', this.rounds);
};

Game.prototype.getBroadcast = function() {
    return this.mainSocket.sockets.in(this.id.toString());
};

Game.prototype.sendPlayerCoups = function () {
    var b = this.getBroadcast();
    var playerCardsLength = [];
    var verboseTable = [];

    this.players.forEach(function (player) {
        playerCardsLength.push(player.cards.length);
    });

    this.table.forEach(function (coup) {
        verboseTable.push([
            cards.getCard(coup[0], true),
           coup[1]
        ]);
    });

    b.emit('setPlayerCoup', this.playerCoup, 
           playerCardsLength, verboseTable);

    this.players.forEach(function (p) {
        p.myCoup = false;
    });

    this.players[this.playerCoup].myCoup = true;
};

Game.prototype.distribuiteCards = function () {
    var pack = cards.getCards(4, 3);
    
    if (this.playerCoup == -1)
        this.playerCoup = Math.floor(Math.random()*3);

    this.players.forEach(function (p, i) {
        p.setCards(pack[i]);
    });

    this.sendPlayerCoups();
};

Game.prototype.startGame = function () {
    this.players.forEach(function (p) {
        p.gameStarted();
    });

    this.emit("start");
    this.distribuiteCards();
}

Game.prototype.endGame = function (reason) {
    this.online = false;

    this.players.forEach(function(p) {
        p.endGame(reason);
    });

    this.players = [];
    this.emit("end");    
}


var GamesController = function (mainSocket) {
    this.games = [];
    this.lastOpenedGame = null;
    this.mainSocket = mainSocket;
};

GamesController.prototype._onGameClosed = function (game) {
    var idx = this.games.indexOf(game);
    this.games.splice(idx, 1);
};

GamesController.prototype._onGameStarted = function (game) {
    this.lastOpenedGame = null;
}

GamesController.prototype.generateNewGame = function () {
    var me = this;

    var g = new Game(this.mainSocket);
    this.games.push(g);
        
    g.on("end", function () {
        me._onGameClosed(this);
    });

    g.on("start", function () {
        me._onGameStarted(this);
    });

    this.lastOpenedGame = g;

    return g;
};
    
GamesController.prototype.getLastedOpenedGame = function () {
    if (this.lastOpenedGame)
        return this.lastOpenedGame;
    else
        return this.generateNewGame();
};
    
GamesController.prototype.addPlayer = function (p) {
    var game = this.getLastedOpenedGame()
    game.addPlayer(p);
}

exports.Player = Player;
exports.GamesController = GamesController;