(function($){
    var Game = function(element, options)
    {
	var elem = $(element);
	var obj = this;
        var playerNum = -1;
        var cards = [];
        var myCoup = false;

	this.settings = $.extend({
	}, options || {});

        
        this.drawCards = function () {
            $('div#player_'+playerNum+' .cards img')
	        .attr('src', '').parent().fadeOut();
            
            for (i=0; i<cards.length; i+=1) {
	        c = cards[i];
	        $('div#player_'+playerNum+' .card[rel="'+i+'"] img')
	            .attr('src', "/cards/"+c+".png").parent().fadeIn();
            }
        }
	
	var socket = io.connect('http://localhost:3000');
	
	socket.on('connect', function () {
            $('#waiting').fadeIn();
            console.info('connectado');
        });
        
        socket.on('setPlayerNum', function (num) {
            playerNum = num;
        });
        
        socket.on('setPlayerCards', function (pack) {
            cards = pack;
            obj.drawCards();
        });

        socket.on('gameStarted', function () {
            $('#waiting').fadeOut();
            console.info('jogo iniciado');
        });

        socket.on('setMyCoup', function () {
            myCoup = true;

            $('span.coup').fadeOut();
            $('#player_'+playerNum+' span.coup').fadeIn();

            $('#player_'+playerNum+' .card')
		.hover(function (e) {
		    $(this).animate({opacity: 0.8, marginTop: 20,}, 500 );
		}, function (e) {
		    $(this).animate({opacity: 1.0, marginTop: 0,}, 500 );
		})
		.click(function (e) {
		    var num = $(this).attr('rel');
                    if (myCoup)
                        socket.emit('coup', num);
		});
        });

        socket.on('setPlayerCoup', function (num) {
            myCoup = false;

            $('span.coup').fadeOut();
            $('#player_'+num+' span.coup').fadeIn();
        });

        socket.on('reconnecting', function () {
            console.info('System', 'Attempting to re-connect to the server');
        });

        socket.on('error', function (e) {
            console.info('System', e ? e : 'A unknown error occurred');
        });
    }
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
