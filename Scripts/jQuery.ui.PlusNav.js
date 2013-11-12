/* jshint browser: true, jquery: true, sub: true */

(function ($) {
    $.fn.widest = function() {
        var widest = this.first();
        var widestWidth = this.width();

        this.each(function() {
            var elem = $(this);

            if (widestWidth < elem.width()) {
                widest = elem;
                widestWidth = elem.width();
            }
        });

        return widest;
    };

    $.widget("kodingsykosis.plusnav", {
        options: {
            duration: 300,
            collapsedWidth: '3em',
            delay: 400,
            isPinned: false,
            autoExpand: true,
            trigger: undefined
        },

        /*******************
         *  BaseWidget overrides
         *******************/

        _create: function() {
            var self = this;

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

            var subNavs =
            this.triggers =
            this.element
                .find('> li > ul, > li > div')
                .addClass('ui-plusnav-subnav');

            if (this.options.trigger) {
                this.triggers = $(this.options.trigger)
                    .on({
                        mouseenter: $.proxy(this._onMouseEnter, this),
                        mouseleave: $.proxy(this._onMouseLeave, this),
                        click: function() {
                            self.togglePin();
                        }
                    });
            }

            subNavs
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

        _init: function() { },
        _destroy: function() { },

        /*******************
         *  Public Methods
         *******************/

        active: function(tabId) {
            var self = this;
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

                    var subMenu = active.children('.ui-plusnav-subnav:first');
                    var targetWidth = this._subMenuWidth(subMenu) || 0;
                    this._trigger('beforechange', undefined, { subMenuWidth: targetWidth });
                    this._showSub(subMenu, function() {
                        self._trigger('change', undefined, { subMenuWidth: subMenu.length === 0 ? 0 : self.width() });
                    });
                }
            }

            return active;
        },

        expand: function(callback) {
            if (!this.lastSub || !this.lastSub.is(':visible')) {
                if (typeof callback === 'function') callback();
                return;
            }

            var subMenu = this.lastSub;
            var expandedWidth = this._subMenuWidth(subMenu);
            var self = this;
            this.element
                .stop(this.widgetName, true, true)
                .delay(this.options['delay'], this.widgetName)
                .queue(this.widgetName, function(next) {
                    if (subMenu.length === 0) {
                        next();
                        return;
                    }

                    subMenu
                        .stop(true, false)
                        .animate({
                                width: expandedWidth
                            }, {
                                duration: self.options['duration'],
                                step: function(now, tween) {
                                    self._trigger('expanding', undefined, { now: now, tween: tween });
                                },
                                complete: function() {
                                    self._trigger('expand');
                                    next();
                                }
                            });
                });

            if (typeof callback === 'function') {
                this.element
                    .queue(function(next) {
                        if (callback() !== false) {
                            next();
                        }
                    });
            }

            this.element
                .dequeue(this.widgetName);
        },

        collapse: function(callback) {
            if (!this.lastSub || !this.lastSub.is(':visible')) {
                if (typeof callback === 'function') callback();
                return;
            }

            var subMenu = this.lastSub;
            var collapsedWidth = this.options['collapsedWidth'];
            var self = this;
            this.element
                .stop(this.widgetName, true, true)
                .delay(this.options['delay'], this.widgetName)
                .queue(this.widgetName, function(next) {
                    if (subMenu.length === 0) {
                        next();
                        return;
                    }

                    subMenu
                        .stop(true, false)
                        .animate({
                                width: collapsedWidth
                            }, {
                                duration: self.options['duration'],
                                step: function(now, tween) {
                                    self._trigger('collapsing', undefined, { now: now, tween: tween });
                                },
                                complete: function() {
                                    self._trigger('collapse');
                                    next();
                                }
                            });
                });

            if (typeof callback === 'function') {
                this.element
                    .queue(function(next) {
                        if (callback() !== false) {
                            next();
                        }
                    });
            }

            this.element
                .dequeue(this.widgetName);
        },

        pin: function() {
            var self = this;

            this.options
                .isPinned = true;

            this.expand(function() {
                var width = 0;
                if (self.lastSub) {
                    width = self._subMenuWidth(self.lastSub);
                }

                self._trigger('pinned', undefined, { subMenuWidth: width });
            });
        },

        unpin: function() {
            var self = this;

            this.options
                .isPinned = false;

            this.collapse(function() {
                self._trigger('unpinned', undefined, { subMenuWidth: 0 });
            });
        },

        togglePin: function() {
            if (this.options.isPinned) {
                this.unpin();
            } else {
                this.pin();
            }
        },

        width: function() {
            if (this.lastSub) {
                return this._subMenuWidth(this.lastSub);
            }

            return 0;
        },

        /*******************
         *  Private Methods
         *******************/

        _showSub: function(elem, callback) {
            if (this.lastSub) {
                this._hideSub(this.lastSub, true);
            }

            var self = this;
            this.element
                .stop(true, true)
                .queue(this.widgetName, function(next) {
//                    if ((parseFloat(elem.css('minWidth')) || 0) > 0) {
//                        elem.data('minWidth', parseFloat(elem.css('minWidth')));
//                    }

                    if (elem.length === 0) {
                        next();
                        return;
                    }

                    elem.css({
                        top: self.element.outerHeight(),
                        width: self.options.isPinned ? self._subMenuWidth(elem) : self.options['collapsedWidth'],
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
                });

            if (typeof callback === 'function') {
                this.element
                    .queue(function(next) {
                        if (callback() !== false) {
                            next();
                        }
                    });
            }

            this.element
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
            var width = widest.width() + paddingRight;
            var minWidth = this._minWidth(elem);
            return Math.max(minWidth, width);
        },

        _minWidth: function(elem) {
            if ((parseFloat(elem.css('minWidth')) || 0) > 0) {
                elem.data('minWidth', parseFloat(elem.css('minWidth')) || 0);
            }

            return parseFloat(elem.data('minWidth') || 0);
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
            if (!this.options.isPinned && (!this.options.autoExpand || this.options.trigger)) {
                this.expand();
            }
        },

        _onMouseLeave: function(event) {
            if (!this.options.isPinned && (!this.options.autoExpand || this.options.trigger)) {
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