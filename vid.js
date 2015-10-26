// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

(function ( $, window, document, undefined ) {
    "use strict";

var pluginName = "Vid",
    defaults = {
        $videoWrap: $(".video-wrap"),
        $videoFader: $(".video-fader"),
        $soundIcon: $(".ton-icon"),
        $outerWrap: $(window),
        $window: $(window),
        minimumVideoWidth: 400,
        fadeOnScroll: true,
        pauseVideoOnViewLoss: true
    };

function Plugin( el, options ) {
    var me = this;
    this.el = el;
    this.options = $.extend( {}, defaults, options );
    this.options.$video = $(el);

    this.detectBrowser();
    this.options.has3d = this.detect3d();

    this.options.$video.css('visibility', 'hidden');
    if(this.options.fadeOnScroll) {
        me.fadeScroll();
    }
    this.options.$video.on('canplay canplaythrough', readyCallback);
    if (this.options.$video[0].readyState > 3) {
        readyCallback();
    }

    function readyCallback() {
        me.options.$video.css('visibility', 'visible');
        me.options.$videoWrap.css('background-image', 'none');
        me.options.$soundIcon.css('visibility', 'visible').animate({opacity:1},2000);
        me.options.originalVideoW = me.options.$video[0].videoWidth;
        me.options.originalVideoH = me.options.$video[0].videoHeight;
        if(me.running) {
            return;
        }
        me.init();
    }
}

Plugin.prototype = {

    init: function() {
        var me = this;
        this.running = true;

        this.options.$window.resize(function() {
            me.positionObject(me.options.$video);
        });

        this.options.$soundIcon.on('click', function(){
            me.soundToggle();
        });

        if(this.options.pauseVideoOnViewLoss) {
            me.videoToggle();
        }

        this.options.$window.trigger('resize');
    },

    detect3d: function () {
        var el = document.createElement('p'),
        has3d,
        transforms = {
            'webkitTransform':'-webkit-transform',
            'OTransform':'-o-transform',
            'msTransform':'-ms-transform',
            'MozTransform':'-moz-transform',
            'transform':'transform'
        };

        document.body.insertBefore(el, null);

        for(var t in transforms){
            if( el.style[t] !== undefined ){
                el.style[t] = 'translate3d(1px,1px,1px)';
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);

        return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
    },

    detectBrowser: function () {
        var val = navigator.userAgent.toLowerCase();

        if( val.indexOf('chrome') > -1 || val.indexOf('safari') > -1 ) {
            this.options.browser = 'webkit';
            this.options.browserPrexix = '-webkit-';
        }
        else if( val.indexOf('firefox') > -1 ) {
            this.options.browser = 'firefox';
            this.options.browserPrexix = '-moz-';
        }
        else if (val.indexOf('MSIE') !== -1 || val.indexOf('Trident/') > 0) {
            this.options.browser = 'ie';
            this.options.browserPrexix = '-ms-';
        }
        else if( val.indexOf('Opera') > -1 ) {
            this.options.browser = 'opera';
            this.options.browserPrexix = '-o-';
        }
    },

    scaleObject: function($video, $videoWrap) {
        var me = this, 
            heightScale,
            widthScale,
            scaleFactor;

        $videoWrap.width(this.options.$outerWrap.width());
        $videoWrap.height(this.options.$outerWrap.height());

        heightScale = this.options.$window.width() / this.options.originalVideoW;
        widthScale = this.options.$window.height() / this.options.originalVideoH;

        scaleFactor = heightScale > widthScale ? heightScale : widthScale;

        if (scaleFactor * this.options.originalVideoW < this.options.minimumVideoWidth) {
            scaleFactor = this.options.minimumVideoWidth / this.options.originalVideoW;
        }

        $video.width(scaleFactor * this.options.originalVideoW);
        $video.height(scaleFactor * this.options.originalVideoH);

        return {
            xPos: -(parseInt($video.width() - this.options.$window.width()) / 2),
            yPos: parseInt($video.height() - this.options.$window.height()) / 2
        };

    },

    positionObject: function($video) {
        var me = this,
            scrollPos = this.options.$window.scrollTop(),
            scaleObject = this.scaleObject($video, me.options.$videoWrap),
            xPos = scaleObject.xPos,
            yPos = scaleObject.yPos;

        if(me.options.has3d) {
            $video.css(me.options.browserPrexix + 'transform3d', 'translate3d(-'+ xPos +'px, ' + yPos + 'px, 0)');
            $video.css('transform', 'translate3d('+ xPos +'px, ' + yPos + 'px, 0)');
        } else {
            $video.css(me.options.browserPrexix + 'transform', 'translate(-'+ xPos +'px, ' + yPos + 'px)');
            $video.css('transform', 'translate('+ xPos +'px, ' + yPos + 'px)');
        }
    },

    videoToggle: function() {
        var me = this;

        me.options.$window.on('scroll', function () {
            if( me.options.$window.scrollTop() < me.options.$videoWrap.height() ) {
                me.options.$video.get(0).play();
                if ( !me.options.$video.prop('muted') ) {
                    if ( me.options.$soundIcon.hasClass("is-off") ) {
                        me.options.$soundIcon.removeClass("is-off").addClass("is-on");
                    }
                }
            } else {
                me.options.$video.get(0).pause();
                if( me.options.$soundIcon.hasClass("is-on") ){
                    me.options.$soundIcon.removeClass("is-on").addClass("is-off");
                }
            }
        });
    },

    soundToggle: function() {
        var me = this,
            $critic = $(".critic");

        if ( me.options.$video.prop('muted') ) {
            me.options.$video.prop('muted', false);
            me.options.$soundIcon.removeClass("is-off").addClass("is-on");
            $critic.fadeTo( "slow" , 0.2 );
        } else {
            me.options.$video.prop('muted', true);
            me.options.$soundIcon.removeClass("is-on").addClass("is-off");
            $critic.fadeTo( "slow" , 1 );
        }
    },

    fadeScroll: function() {
        var me = this,
            scrollMeasure = (me.options.$window.height()*0.8),
            scrollRate;

        me.options.$window.on('scroll', function() {
            scrollRate = me.options.$window.scrollTop();
            if ( scrollRate < scrollMeasure )
                me.options.$videoFader.css({"opacity":((scrollRate)/1000).toFixed(2)});
        });
    }
};
$.fn[pluginName] = function ( options ) {
    return this.each(function () {
        if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" + pluginName,
            new Plugin( this, options ));
        }
    });
};

})( window.jQuery, window, document );

