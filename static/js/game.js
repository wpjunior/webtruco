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


(function($){
    var Game = function(element, options)
    {
        var me = this;

	this.elem = $(element);
        this.playerNum = -1;
        this.cards = [];
        this.myCoup = false;

	this.settings = $.extend({
	}, options || {});

        var socket = io.connect(
            'http://localhost:3000',
            {reconnect: false,
             transports: ['websocket', 'flashsocket']
            });

        socket.on('connect', function () {
            $('div.blockdisplay').fadeOut();
            $('#waiting').fadeIn();
        });

        socket.on('connecting', function () {
            $('div.blockdisplay').fadeOut();
            $('#connecting').fadeIn();
        });

        socket.on('disconnect', function () {
            $('div.blockdisplay').fadeOut();
            $('#disconnected').fadeIn();
        });
        
        socket.on('setPlayerNum', function (num) {
            me.playerNum = num;
        });
        
        socket.on('setPlayerCards', function (pack) {
            me.cards = pack;
            me.drawCards();
        });

        socket.on('gameStarted', function () {
            $('#waiting').fadeOut();
        });

        socket.on('join', function (gameId) {
            $('#game_id').text(gameId);
        });

        socket.on('endGame', function (reason) {
            console.info(reason);
        });
        
        socket.on('setPlayerCoup', function (num, cardsLength, tableCards) {
            me.setCardsLength(cardsLength);
            me.drawTableCards(tableCards);

            if (num == me.playerNum) {
                me.setMyCoup();
            } else {
                me.myCoup = false;

                $('span.coup').fadeOut();
                $('#player_'+num+' span.coup').fadeIn();
            }
        });

        socket.on('error', function (e) {
            console.info('System', e ? e : 'A unknown error occurred');
        });

        this.socket = socket;
    };

    Game.prototype.setCardsLength = function (length) {
        /*
         * update cards length of other players
         */

        for (var i=0; i<4; i+=1) {
            if (i==this.playerNum) continue;
            $('div#player_'+i+' .cards img')
	        .attr('src', '').parent().hide();

            if ((i % 2) == 0)
                var time=1;
            else
                var time=0;

            for (var j=0; j<length[i]; j+=1) {
                $('div#player_'+i+' .card[rel="'+j+'"] img')
	            .attr('src', "/cards/backtime"+time+".png").parent().show();
            }
        }
    };

    Game.prototype.drawTableCards = function (cards) {
        $('div#game_table .cards img')
	    .attr('src', '').parent().fadeOut();
            
        for (i=0; i<cards.length; i+=1) {
	    var c = cards[i][0];
            
            if ((cards[i][1] % 2) == 0)
                var time=0;
            else
                var time=1;

	    $('div#game_table .card[rel="'+i+'"] img')
	        .attr('src', "/cards/"+c+".png").parent().fadeIn();
            $('div#game_table .card[rel="'+i+'"]')
                .removeClass('time0 time1')
                .addClass('time'+time);
        }
    };

    Game.prototype.setMyCoup = function () {
        /*
         * Activate coup support
         */

        var me = this;
        this.myCoup = true;

        $('span.coup').fadeOut();
        $('#player_'+this.playerNum+' span.coup').fadeIn();

        $('#player_'+this.playerNum+' .card')
	    .hover(function (e) {
		$(this).animate({opacity: 0.8, marginTop: 20,}, 500 );
	    }, function (e) {
		$(this).animate({opacity: 1.0, marginTop: 0,}, 500 );
	    })
	    .click(function (e) {
		var num = $(this).attr('rel');
                if (me.myCoup)
                    me.socket.emit('coup', num);
	    });
    };

    Game.prototype.drawCards = function () {
        /*
         * Draw my cards
         */
        $('div#player_'+this.playerNum+' .cards img')
	    .attr('src', '').parent().fadeOut();
            
        for (i=0; i<this.cards.length; i+=1) {
	    var c = this.cards[i];
	    $('div#player_'+this.playerNum+' .card[rel="'+i+'"] img')
	        .attr('src', "/cards/"+c+".png").parent().fadeIn();
        }
    };
	
    $.fn.game = function(options)
    {

	var element = $(this);
	
	// Return early if this element already has a plugin instance
	if (element.data('game')) return;
	var game = new Game(this, options);

        // Store plugin object in this element's data
        element.data('game', game);
        return game;
    };
})(jQuery);
