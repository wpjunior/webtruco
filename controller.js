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
var cards = require('./cards');

var lastGameId = 0;
var playerCommands = {
    changeNick: function (player, args) {
        player.nick = args[0];
        player.emit('nickchanged', nick);
    },
};


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

    socket.on('message', function (message) {
        console.info(message);
        try {
            data = JSON.parse(message);
            
            if ((!data.cmd)||(!data.args))
                return;

            cmd = playerCommands[data.cmd];
            cmd(this, data.args);

        } catch (err) {
            console.info(err);
            console.info('Closing connection');
            socket.end();
            socket.destroy();
            return false;
        }
    });

    socket.on('coup', function (num) {
        if (num >= me.cards.length)
            return;

        var cd = me.cards.splice(num, 1);
        me.emit('coup', cd);
        me.sendCards();
    });

    socket.on('end', function () {
        console.info('end');
    });

    socket.on('error', function(err) {
        console.info(err);
    });
}

Player.prototype.sendCards = function () {
    var i = 0;
    var namedCards = [];
    
    for (i=0; i<this.cards.length; i+=1) {
        var cardId = this.cards[i];
        namedCards.push(cards.getCard(cardId, true));
    }

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

Player.prototype.gameStarted = function (gameId) {
    this.socket.emit("gameStarted", gameId);
};

Player.prototype.setPlayerCoup = function (playerNum) {
    this.socket.emit("setPlayerCoup", playerNum);
    this.myCoup = false;
};
  
Player.prototype.setMyCoup = function () {
    this.socket.emit("setMyCoup");
    this.myCoup = true;
};

var Game = function () {
    events.EventEmitter.call(this);
    
    this.players = [];
    this.closed = false;
    this.created = new Date();
    this.playerCoup = -1;
    this.table = [];

    lastGameId++;
    this.id = lastGameId;
};

util.inherits(Game, events.EventEmitter);

Game.prototype.addPlayer = function (p) {
    var me = this;
    if (this.closed)
        throw "This Game is Closed"

    this.players.push(p);
    p.setNumber(this.players.indexOf(p));

    p.on('nickchanged', function (nick) {
        console.info('nickchanged', nick);
    });

    p.on('coup', function (cardNum) {
        if (me.table.length == 4)
            me.finishCoup()
        if (me.playerCoup == 0)
            me.playerCoup = 3;
        else
            me.playerCoup -= 1;

        me.sendPlayerCoups();
        me.table.push([cardNum, p.num]);
    });

    if (this.players.length == 4) {
        this.closed = true;
        this.startGame();
    }
};

Game.prototype.finishCoup = function () {
    console.info('finishCoup');
    this.table = [];
};

Game.prototype.sendPlayerCoups = function () {
    for (var i=0; i<4; i+=1) {
        if (i == this.playerCoup)
            this.players[i].setMyCoup();
        else
            this.players[i].setPlayerCoup(this.playerCoup);
    }
};

Game.prototype.distribuiteCards = function () {
    var pack = cards.getCards(4, 3);
    
    if (this.playerCoup == -1)
        this.playerCoup = Math.floor(Math.random()*3);

    for (var i=0; i<4; i+=1)
        this.players[i].setCards(pack[i]);

    this.sendPlayerCoups();
};

Game.prototype.startGame = function () {
    for (var i=0; i<this.players.length; i+=1) {
        this.players[i].gameStarted(this.id);
    }
    this.emit("start");
        
    this.distribuiteCards();
}

Game.prototype.endGame = function () {
    this.emit("close");    
}


var GamesController = function () {
    this.games = [];
    this.lastOpenedGame = null;
};

GamesController.prototype._onGameClosed = function () {
    console.info(this);
};

GamesController.prototype._onGameStarted = function () {
    this.lastOpenedGame = null;
}

GamesController.prototype.generateNewGame = function () {
    var me = this;

    var g = new Game();
    this.games.push(g);
        
    g.on("close", function () {
        me._onGameClosed();
    });

    g.on("start", function () {
        me._onGameStarted();
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