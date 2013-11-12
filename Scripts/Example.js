/// reference="jQuery.ui.PlusNav.js"
/* jshint browser: true, jquery: true, sub: true, devel: true */
(function($) {
    $(function() {
        var pinned = false;
        var updLayout = function(data) {
            var elem = $('.ui-layout-content-inner');
            var marginLeft = Math.max(elem.data('marginLeft'), data.subMenuWidth);

            elem.stop(true, false).delay(300).animate({
                marginLeft: marginLeft
             }, {
                duration: 350
            });
        };


        $('.ui-navigation-menu').plusnav({
            trigger: '.ui-navigation-trigger',
            pinned: function(event, data) {
                pinned = true;

                var elem = $('.ui-layout-content-inner');
                elem.data('marginLeft', parseFloat(elem.css('marginLeft')));
                updLayout(data);
            },
            unpinned: function(event, data) {
                pinned = false;
                updLayout(data);
            },
            beforechange: function(event, data) {
                if (!pinned) return;
                updLayout(data);
            }
        });

        $('#TogglePin').click(function() {
            $('.ui-navigation-menu').plusnav('togglePin');
        });
    });
})(jQuery);