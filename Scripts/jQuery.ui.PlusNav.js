/* jshint browser: true, jquery: true, sub: true */

(function ($) {
    $.fn.widest = function() {
        var widest = $();
        var widestWidth = 0;

        this.each(function() {
            var elem = $(this);

            if (widestWidth < elem.prop('scrollWidth')) {
                widest = elem;
                widestWidth = elem.prop('scrollWidth');
            }
        });

        return widest;
    };
    
    $.widget("kodingsykosis.plusnav", {
        options: {
            duration: 300,
            collapsedWidth: '3em',
            delay: 400,
            pinned: false
        },

        /*******************
         *  BaseWidget overrides
         *******************/

        _create: function() {
            //Remove Text nodes to prevent formatting issues
            this.element
                .contents()
                .not(function() { return this.nodeType !== 3; })
                .remove();

            //Init Menu
            this.element
                .addClass('ui-plusnav')
                .children('li')
                .addClass('ui-plusnav-top')
                .children('a')
                .click($.proxy(this._onTabClicked, this));

            this.element
                .find('> li > ul, > li > div')
                .addClass('ui-plusnav-subnav')
                .on({
                    mouseenter: $.proxy(this._onMouseEnter, this),
                    mouseleave: $.proxy(this._onMouseLeave, this)
                })
                .children('li')
                .click($.proxy(this._onSubItemClicked, this));

            this.element
                .show();

            var hash = window.location.hash;
            if (typeof hash !== 'undefined' && hash.length) {
                this.active(hash);
            } else {
                var active = this.element.children('[defaultTab]');
                this.active(active.index());
            }
        },

        _init: function() {

        },

        _destroy: function() {

        },

        /*******************
         *  Public Methods
         *******************/

        active: function(tabId) {
            var active =
                this.element
                    .children('.ui-plusnav-active');

            //Should support tab index too.
            if (typeof tabId !== 'undefined') {
                var target = $();

                if (typeof tabId === 'number') {
                    if (tabId === -1) {
                        tabId = 0;
                    }

                    target =
                        this.element
                            .children()
                            .eq(tabId);
                } else {
                    target =
                        this.element
                            .find('[href="' + tabId + '"]:first');

                    if (!target.is('.ui-plusnav-top')) {
                        target.parent().addClass('ui-plusnav-active');
                        target = target.parents('.ui-plusnav-top:first');
                    }
                }

                if (target.length) {
                    target.addClass('ui-plusnav-active');
                    active.removeClass('ui-plusnav-active');
                    active = target;
                    this._showSub(active.children('.ui-plusnav-subnav:first'));
                }
            }

            return active;
        },

        expand: function() {
            if (!this.lastSub || !this.lastSub.is(':visible')) {
                return;
            }

            var subMenu = this.lastSub;
            var expandedWidth = this._subMenuWidth(subMenu);
            var self = this;
            this.element
                .stop(this.widgetName, true, true)
                .delay(this.options['delay'], this.widgetName)
                .queue(this.widgetName, function(next) {
                    subMenu
                        .stop(true, false)
                        .animate({
                                width: expandedWidth
                            }, {
                                duration: self.options['duration'],
                                step: function(now, tween) {
                                    self._trigger('expanding', now, tween);
                                },
                                complete: function() {
                                    self._trigger('expand');
                                    next();
                                }
                            });
                })
                .dequeue(this.widgetName);
        },

        collapse: function() {
            if (!this.lastSub || !this.lastSub.is(':visible')) {
                return;
            }

            var subMenu = this.lastSub;
            var collapsedWidth = this.options['collapsedWidth'];
            var self = this;
            this.element
                .stop(this.widgetName, true, true)
                .delay(this.options['delay'], this.widgetName)
                .queue(this.widgetName, function(next) {
                    subMenu
                        .stop(true, false)
                        .animate({
                                width: collapsedWidth
                            }, {
                                duration: self.options['duration'],
                                step: function(now, tween) {
                                    self._trigger('collapsing', now, tween);
                                },
                                complete: function() {
                                    self._trigger('collapse');
                                    next();
                                }
                            });
                })
                .dequeue(this.widgetName);
        },

        pin: function() {
            this.options
                .pinned = true;
            
            this.expand();
        },
        
        unpin: function() {
            this.options
                .pinned = false;
            
            this.collapse();
        },
        
        togglePin: function() {
            if (this.options.pinned) {
                this.unpin();
            } else {
                this.pin();
            }
        },
        
        width: function() {
            return this.lastSub.outerWidth(true);
        },
        
        /*******************
         *  Private Methods
         *******************/

        _showSub: function(elem) {
            if (this.lastSub) {
                this._hideSub(this.lastSub, true);
            }

            var self = this;
            this.element
                .queue(this.widgetName, function(next) {
                    if ((parseFloat(elem.css('minWidth')) || 0) > 0) {
                        elem.data('minWidth', parseFloat(elem.css('minWidth')));
                    }

                    elem.css({
                        top: self.element.outerHeight(),
                        width: self.options.pinned ? self._subMenuWidth(elem) : self.options['collapsedWidth'],
                        minWidth: 0,
                        overflow: 'hidden'
                    })
                        .show({
                            effect: 'slide',
                            duration: self.options['duration'],
                            step: function(now, tween) {
                                self._trigger('showing', now, tween);
                            },
                            complete: function() {
                                self.lastSub = elem;
                                self._trigger('show');
                                next();
                            }
                        });
                })
                .dequeue(this.widgetName);
        },

        _hideSub: function(elem, deferred) {
            var self = this;
            this.element
                .queue(this.widgetName, function(next) {
                    elem.hide({
                        effect: 'slide',
                        duration: self.options['duration'],
                        step: function(now, tween) {
                            self._trigger('hidding', now, tween);
                        },
                        complete: function() {
                            self._trigger('hide');
                            next();
                        }
                    });
                });

            if (!deferred) {
                this.element
                    .dequeue();
            }
        },

        _subMenuWidth: function(elem) {
            var widest = elem.children().widest();
            var inner = widest.children('a:first');
            var paddingRight = parseFloat(inner.css('paddingRight'));
            var width = widest.prop('scrollWidth') + paddingRight;
            var minWidth = elem.data('minWidth') || 0;
            return width < minWidth ? minWidth : width;
        },

        /*******************
         *  Events
         *******************/

        _onTabClicked: function(event) {
            event.preventDefault();
            var elem = $(event.delegateTarget || event.target).parent();
            this.active(elem.index());
        },

        _onMouseEnter: function(event) {
            if (!this.options.pinned) {
                this.expand();
            }
        },

        _onMouseLeave: function(event) {
            if (!this.options.pinned) {
                this.collapse();
            }
        },

        _onSubItemClicked: function(event) {
            var target = $(event.delegateTarget || event.target);
            this.lastSub
                .find('.ui-plusnav-active')
                .removeClass('ui-plusnav-active');

            target.addClass('ui-plusnav-active');
        }
    });
})(jQuery);