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

        var socket = io.connect('http://localhost:3000');

        socket.on('connect', function () {
            $('#waiting').fadeIn();
            console.info('connectado');
        });
        
        socket.on('setPlayerNum', function (num) {
            me.playerNum = num;
        });
        
        socket.on('setPlayerCards', function (pack) {
            me.cards = pack;
            me.drawCards();
        });

        socket.on('gameStarted', function (gameId) {
            $('#waiting').fadeOut();
            console.info('jogo iniciado', gameId);
        });

        socket.on('setMyCoup', function () {
            me.myCoup = true;

            $('span.coup').fadeOut();
            $('#player_'+me.playerNum+' span.coup').fadeIn();

            $('#player_'+me.playerNum+' .card')
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
        });

        socket.on('setPlayerCoup', function (num) {
            me.myCoup = false;

            $('span.coup').fadeOut();
            $('#player_'+num+' span.coup').fadeIn();
        });

        socket.on('reconnecting', function () {
            console.info('System', 'Attempting to re-connect to the server');
        });

        socket.on('error', function (e) {
            console.info('System', e ? e : 'A unknown error occurred');
        });

        this.socket = socket;
        
    };

    Game.prototype.drawCards = function () {
        $('div#player_'+this.playerNum+' .cards img')
	    .attr('src', '').parent().fadeOut();
            
        for (i=0; i<this.cards.length; i+=1) {
	    c = this.cards[i];
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
