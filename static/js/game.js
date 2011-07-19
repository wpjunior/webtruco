(function($){
    var Game = function(element, options)
    {
	var elem = $(element);
	var obj = this;
        var playerNum = -1;
        var cards = [];

	this.settings = $.extend({
	}, options || {});

        
        this.drawCards = function () {
            $('div#player_'+playerNum+' .cards img')
	        .attr('src', '');
            
            for (i=0; i<cards.length; i+=1) {
	        c = cards[i];
	        $('div#player_'+playerNum+' .card[rel="'+i+'"] img')
	            .attr('src', "/cards/"+c+".png").show();
            }
        }
	
	var socket = io.connect('http://localhost:3000');
	
	socket.on('connect', function () {
            console.info('connectado');
        });
        
        socket.on('setPlayerNum', function (num) {
            playerNum = num;
        });
        
        socket.on('setPlayerCards', function (pack) {
            cards = pack;
            obj.drawCards();
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
