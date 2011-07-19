var util = require("util");
var events = require('events');
var cards = require('./cards');


function Player (socket) {
    events.EventEmitter.call(this);
    this.socket = socket;

    var nick = null;
    var obj = this;
    var pack = []; //cards
    var num = -1;
    var time = -1;

    var commands = {
        changeNick: function (args) {
            nick = args[0];
            obj.emit('nickchanged', nick);
            //TODO: emit nick changed
        },
    };
    
    socket.on('message', function (message) {
        console.info(message);
        try {
            data = JSON.parse(message);
            
            if ((data.cmd == undefined)||(data.args == undefined))
                return;

            cmd = commands[data.cmd];
            cmd(data.args);

        } catch (err) {
            console.info(err);
            console.info('Closing connection');
            socket.end();
            socket.destroy();
            return false;
        }
    });

    socket.on('end', function () {
        console.info('end');
    });

    socket.on('error', function(err) {
        console.info(err);
    });

    this.sendCards = function () {
        var i = 0;
        var namedCards = [];

        for (i=0; i<pack.length; i+=1) {
            var cardId = pack[i];
            namedCards.push(cards.getCard(cardId, true));
        }

        socket.emit("setPlayerCards", namedCards);
    }

    this.setCards = function (p) {
        pack = p;
        obj.sendCards();
    }

    this.setNumber = function (num) {
        num = num;
        socket.emit("setPlayerNum", num);
    }
}

util.inherits(Player, events.EventEmitter);

function Game () {
    events.EventEmitter.call(this);
    
    var obj = this;

    var players = [];
    var closed = false;
    var created = new Date();
    var player_coup = -1;

    receiveData = function (data) {
        console.info(this);
    }

    this.addPlayer = function(p) {
        if (closed)
            throw "This Game is Closed"

        players.push(p);
        p.setNumber(players.indexOf(p));

        p.on('nickchanged', function (nick) {
            console.info('nickchanged', nick);
        });

        if (players.length == 4) {
            closed = true;
            this.startGame();
        }
    }

    this.distribuiteCards = function () {
        var pack = cards.getCards(4, 3);
        
        for (i=0; i<4; i+=1)
            players[i].setCards(pack[i]);
    }
    this.startGame = function () {
        obj.emit("start");
        console.info('Starting Game');
        obj.distribuiteCards();
    }

    this.endGame = function () {
        obj.emit("close");
        console.info("Ending Game");
    }
}

util.inherits(Game, events.EventEmitter);

exports.GamesController = function () {
    games = [];
    lastOpenedGame = null;

    //TODO: CLOSE SIGNAL
    _gameClosed = function () {
        console.info(this);
    }
    
    _gameStarted = function () {
        lastOpenedGame = null;
    }

    generateNewGame = function () {
        var g = new Game();
        games.push(g);
        
        g.on("close", _gameClosed);
        g.on("start", _gameStarted);

        lastOpenedGame = g;

        return g;
    };
    
    getLastedOpenedGame = function () {
        if (lastOpenedGame)
            return lastOpenedGame;
        else
            return generateNewGame();
    }
    
    this.addPlayer = function (p) {
        var game = getLastedOpenedGame()
        game.addPlayer(p);
    }
}

exports.Player = Player;
