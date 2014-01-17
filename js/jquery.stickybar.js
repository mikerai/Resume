// JQuery StickyBar Plugin by Taufik Nurrohman
// URL's: https://plus.google.com/108949996304093815163/about
// Usage: $('div').stickyBar();

;(function($) {

	$.fn.stickyBar = function(o) {

		o = $.extend({
			until: "", // Define the `stopper` element here (a CSS selector)
			top: 0, // Top distance of the sticky element
			bottom: 0, // Bottom distance of the sticky element to the `stopper`
			animated: false, // `true` to animate the sticky element
			speed: 400, // Animation speed if the `animated` option value is `true`
			easing: null, // Easing name for the animated sticky element (e.g: "easeOutElastic")
			fixedClass: 'isFixed', // Fixed state class name
			stoppedClass: 'isStopped', // Stopped state class name

			// Some callback function based on the sticky element state
			onFixed: function() {},
			onStatic: function() {},
			onStopped: function() {}

		}, o);

		return this.each(function() {

			var $window = $(window),
				$this = $(this),
				o_top = $this.offset().top,
				o_m_top = $this.css('margin-top'),
				o_m_bottom = $this.css('margin-bottom'),
				o_height = $this.outerHeight(),
				o_pos = $this.css('position'),
				o_limit = (o.until !== "") ? $(o.until).offset().top - o_height - o.top : $(document).height();

			if (!o.animated) {
				// This is a space holder that will be inserted right before the sticky element
				// used to fill the blank space to prevent the page jumping behaviour
				// when the sticky element changes its position from the initial position to a fixed position element
				// The default display is hidden.
				$('<div />', {
					'class': 'space-holder',
					'style': 'display:none;height:' + o_height + 'px;margin-top:' + o_m_top + ';margin-bottom:' + o_m_bottom
				}).insertBefore($this);
			} else {
				// If the selected element is a `static` positioned element, set it as a `relative` position element
				// ... so we can animate the `top` value
				if (o_pos == 'static') {
					$this.css('position', 'relative');
				}
			}

			$window.on("scroll", function() {
				var scrollTop = $(this).scrollTop();
				if (scrollTop >= o_top - o.top) {
					if (scrollTop <= o_limit - o.bottom) {

						// In fixed state...

						o.onFixed.call($this);
						if (!o.animated) {
							$this.css({
								'position': 'fixed',
								'top': o.top,
								'left': $this.offset().left,
								'width': $this.width() + 'px',
								'margin-top': 0
							}).removeClass(o.stoppedClass).addClass(o.fixedClass).prev().show();
						} else {
							$this.stop().animate({
								top: scrollTop - o_top + o.top
							}, o.speed, o.easing, function() {
								$(this).css('top', scrollTop - o_top + o.top);
							}).removeClass(o.stoppedClass).addClass(o.fixedClass);
						}
					} else {

						// Stopped by a `stopper`
						// The sticky element now touching the `stopper` element and not `sticks` again

						o.onStopped.call($this);
						$this.css({
							'position': 'relative',
							'top': o_limit - o_top - o.bottom, // Stick to the stopper
							'left': 0,
							'margin-top': o_m_top,
							'margin-bottom': o_m_bottom + o.bottom
						}).removeClass(o.fixedClass).addClass(o.stoppedClass).prev().hide();
					}
				} else {

					// Back to the default state

					o.onStatic.call($this);
					if (!o.animated) {
						$this.css({
							'position': o_pos,
							'top': 0,
							'left': 0,
							'margin-top': o_m_top,
							'margin-bottom': o_m_bottom
						}).removeClass(o.fixedClass + ' ' + o.stoppedClass).prev().hide();
					} else {
						$this.stop().animate({
							top: 0
						}, o.speed, o.easing, function() {
							$(this).css('top', 0);
						}).removeClass(o.fixedClass + ' ' + o.stoppedClass);
					}
				}
			});

		});

	};

})(jQuery);