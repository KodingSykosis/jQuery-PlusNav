/// reference="jQuery.ui.PlusNav.js"
/* jshint browser: true, jquery: true, sub: true */
(function($) {
    $(function() {
        var pinned = false;
        function updLayout(now) {
            var menu = $('.ui-navigation-menu');
            if (!pinned) return;
            
            var elem = $('.ui-layout-content-inner');
            var width = menu.plusnav('width');
            
            elem.animate({
                marginLeft: width
            }, 5);
        }
        
        
        $('.ui-navigation-menu').plusnav({
            showing: updLayout,
            show: updLayout,
            hidding: updLayout,
            hide: updLayout,
            expanding: updLayout,
            expand: updLayout
        });
        
        $('#TogglePin').click(function() {
            $('.ui-navigation-menu').plusnav('togglePin');
            pinned = !pinned;
        });
    });
})(jQuery);