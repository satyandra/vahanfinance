/**
 * JavaScript to track elements and optionally stick elements, works with jQuery or fusionLib.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 *
 * @package fusionCSS
 * @copyright Copyright (c) 2018 fusionCSS. All rights reserved.
 * @link http://fusionCSS.com
 */

(function() {
	var tracked = [],
		lastScroll = $(window).scrollTop(),
		stickyList = [];

	/**
	 * Test if point reached and trigger handler.
	 *
	 * @param int idx The index of the element being updated.
	 * @param string direction 'up' or 'down' depending on the direction of travel.
	 */
	function testTrigger(idx, direction) {
		// If hit point
		if(lastScroll >= tracked[idx].top && tracked[idx].before) {
			tracked[idx].before = false;
			tracked[idx].handler.call(tracked[idx].element, direction);
			tracked[idx].element.trigger('pointReached', [direction]);
		}
		else if(lastScroll <= tracked[idx].top && !tracked[idx].before) {
			tracked[idx].before = true;
			tracked[idx].handler.call(tracked[idx].element, direction);
			tracked[idx].element.trigger('pointReached', [direction]);
		}
	}

	$.fn.extend({

		/**
		 * Add tracking to a point.
		 * @param opts { offset, handler }
		 */
		trackPoint: function(opts) {
			opts = opts ? opts : {};

			var offset = opts.offset ? opts.offset : 0,
				handler = opts.handler ? opts.handler : function () {},
				offsetType = typeof offset === 'string' && offset.match(/%$/) ? '%' : 'px';

			return this.each(function() {
				var el = $(this),
					d = {
						element: el,
						top: offsetType == '%'
								? ((parseInt(offset) / 100) * $(window).height())
								: parseInt(offset),
						before: true,
						offset: offset,
						handler: handler
					};

				tracked.push(d);

				// Wrap the element
				el.wrap('<div class="trackPointWrapper"></div>');

				// If point already reached then flag it
				if(lastScroll >= d.top)
					testTrigger(tracked.length - 1, 'down');
			});
		},

		/**
		 * Update the offset.
		 *
		 * @param int offset The offset.
		 */
		trackPointSetOffset: function(offset) {
			var offsetType = typeof offset === 'string' && offset.match(/%$/) ? '%' : 'px';

			return this.each(function() {
				for(var i=0;i<tracked.length;i++) {
					if(this === tracked[i].element.get(0)) {
						var oldTop = tracked[i].top,
							top = tracked[i].element.parent().offset().top + (offsetType == '%'
									? ((parseInt(offset) / 100) * $(window).height())
									: parseInt(offset)
							);
						tracked[i].offset = offset;
						tracked[i].top = top;

						if(oldTop != tracked[i].top) {
							testTrigger(i, tracked[i].top > oldTop ? 'up' : 'down');
						}

						break;
					}
				}
			});
		}
	});

	/**
	 * Tack the scrolling.
	 */
	$(window).on('scroll', function () {
		var top = $(window).scrollTop(),
			direction = top > lastScroll ? 'down' : 'up';

		if(top != lastScroll) {
			lastScroll = top;

			for(var i=0;i<tracked.length;i++) {
				testTrigger(i, direction);
			}
		}
	})

	/**
	 * Track resize events.
	 */
		.on('resize', function() {

			for(var i=0;i<tracked.length;i++) {
				var oldTop = tracked[i].top,
					offsetType = typeof tracked[i].offset === 'string' && tracked[i].offset.match(/%$/) ? '%' : 'px',
					top = tracked[i].element.parent().offset().top + (offsetType == '%'
							? ((parseInt(tracked[i].offset) / 100) * $(window).height())
							: parseInt(tracked[i].offset)
					);

				tracked[i].top = top;

				if(oldTop != top) {
					testTrigger(i, tracked[i].top > oldTop ? 'up' : 'down');
				}
			}
		});


	/**
	 * Implement sticky elements
	 */
	$.fn.extend({

		/**
		 * Configure element to stick on scroll.
		 *
		 * @param map opts configuration options.
		 */
		stickyOnScroll: function(opts) {
			opts = opts ? opts : {};

			opts.stuckClass = opts.stuckClass ? opts.stuckClass : 'stuck';
			opts.handler = opts.handler ? opts.handler : function() {};
			opts.minWidth = opts.minWidth ? opts.minWidth : null;
			opts.maxWidth = opts.maxWidth ? opts.maxWidth : null;
			opts.offset = opts.offset ? opts.offset : 0;
			opts.stuck = false;

			return this.each(function() {
				var el = $(this);
				el.get(0)._stickyOpts = opts;

				// Add handler to the element
				el.trackPoint({
					handler: function(direction) {
						var opts = this.get(0)._stickyOpts;

						if(direction == 'down') {

							// Check width restrictions
							var w = $(window).width();
							if((opts.minWidth == null || w >= opts.minWidth) && (opts.maxWidth == null || w <= opts.maxWidth)) {
								// Stick the element
								opts.stuck = true;
								this.parent().height(this.outerHeight(true));
								this.addClass(opts.stuckClass);
								opts.handler.call(this, 'stuck');
								this.trigger('stuck');
							}
						}
						else {

							// Check width restrictions
							var w = $(window).width();
							if(opts.stuck || ((opts.minWidth == null || w >= opts.minWidth) && (opts.maxWidth == null || w <= opts.maxWidth))) {
								// Unstick element
								opts.stuck = false;
								this.parent().height('');
								this.removeClass(opts.stuckClass);
								opts.handler.call(this, 'unstuck');
								this.trigger('unstuck');
							}
						}
					},
					offset: opts.offset
				});

				// Mark the wrapper class
				el.parent().addClass('stickyWrapper');

				// Remember the element
				stickyList.push(el);
			});
		},

		/**
		 * Set the offset for sticky.
		 *
		 * @param offset The offset.
		 */
		stickyOnScrollOffset: function(offset) {
			return this.each(function() {
				this._stickyOpts.offset = offset;
				$(this).trackPointSetOffset(offset);
			});
		}
	});

	/**
	 * On resize update heights of stuck elements.
	 */
	$(window).on('resize', function () {
		for(var i=0;i<stickyList.length;i++) {
			var opts = stickyList[i].get(0)._stickyOpts;

			if(opts.stuck) {
				var el = stickyList[i];
				el.parent().height(el.outerHeight(true));
			}
		}
	});

})();
