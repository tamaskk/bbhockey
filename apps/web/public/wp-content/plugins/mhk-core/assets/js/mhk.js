/* Motorok Háza Kapuvár – front-end (függőség nélkül) */
( function () {
	'use strict';

	var reduce = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	/* ---------- görgetéses megjelenés ---------- */
	function initReveal( root ) {
		var els = ( root || document ).querySelectorAll( '.mhk-reveal:not(.mhk-in)' );
		if ( ! els.length ) return;
		if ( reduce || ! ( 'IntersectionObserver' in window ) ) {
			els.forEach( function ( el ) { el.classList.add( 'mhk-in' ); } );
			return;
		}
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( e ) {
				if ( e.isIntersecting ) {
					e.target.classList.add( 'mhk-in' );
					io.unobserve( e.target );
				}
			} );
		}, { threshold: 0.12, rootMargin: '0px 0px -40px' } );
		els.forEach( function ( el ) { io.observe( el ); } );
	}

	/* ---------- hero slider ---------- */
	function initSlider( root ) {
		( root || document ).querySelectorAll( '.mhk-hero-slider' ).forEach( function ( box ) {
			if ( box.dataset.mhkReady ) return;
			box.dataset.mhkReady = '1';

			var slides = Array.prototype.slice.call( box.querySelectorAll( '.mhk-hs-slide' ) );
			var bars = Array.prototype.slice.call( box.querySelectorAll( '.mhk-s-bar' ) );
			var speed = parseInt( box.dataset.speed, 10 ) || 6000;
			var idx = 0, timer = null;

			if ( slides.length < 2 ) return;

			function show( i ) {
				idx = ( i + slides.length ) % slides.length;
				slides.forEach( function ( s, n ) { s.classList.toggle( 'mhk-is-active', n === idx ); } );
				bars.forEach( function ( b, n ) {
					b.classList.remove( 'mhk-is-active' );
					if ( n === idx ) { void b.offsetWidth; b.classList.add( 'mhk-is-active' ); }
				} );
			}
			function restart() {
				clearInterval( timer );
				if ( ! reduce ) timer = setInterval( function () { show( idx + 1 ); }, speed );
			}

			var next = box.querySelector( '.mhk-slider-arrow.mhk-next' );
			var prev = box.querySelector( '.mhk-slider-arrow.mhk-prev' );
			if ( next ) next.addEventListener( 'click', function () { show( idx + 1 ); restart(); } );
			if ( prev ) prev.addEventListener( 'click', function () { show( idx - 1 ); restart(); } );
			bars.forEach( function ( b, n ) {
				b.addEventListener( 'click', function () { show( n ); restart(); } );
			} );

			// Érintéses lapozás mobilon.
			var x0 = null;
			box.addEventListener( 'touchstart', function ( e ) { x0 = e.touches[ 0 ].clientX; }, { passive: true } );
			box.addEventListener( 'touchend', function ( e ) {
				if ( x0 === null ) return;
				var dx = e.changedTouches[ 0 ].clientX - x0;
				if ( Math.abs( dx ) > 50 ) { show( dx < 0 ? idx + 1 : idx - 1 ); restart(); }
				x0 = null;
			}, { passive: true } );

			// Ne pörögjön a háttérben.
			document.addEventListener( 'visibilitychange', function () {
				if ( document.hidden ) { clearInterval( timer ); } else { restart(); }
			} );

			show( 0 );
			restart();
		} );
	}

	/* ---------- számlálók ---------- */
	function initCounters( root ) {
		var els = ( root || document ).querySelectorAll( '[data-count]:not([data-mhk-done])' );
		if ( ! els.length ) return;
		if ( reduce || ! ( 'IntersectionObserver' in window ) ) {
			els.forEach( function ( el ) {
				el.textContent = el.dataset.count;
				el.setAttribute( 'data-mhk-done', '1' );
			} );
			return;
		}
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( e ) {
				if ( ! e.isIntersecting ) return;
				var el = e.target, target = parseInt( el.dataset.count, 10 ) || 0;
				io.unobserve( el );
				el.setAttribute( 'data-mhk-done', '1' );
				var start = performance.now(), dur = 1300;
				( function tick( now ) {
					var p = Math.min( 1, ( now - start ) / dur );
					el.textContent = Math.round( target * ( 1 - Math.pow( 1 - p, 3 ) ) );
					if ( p < 1 ) requestAnimationFrame( tick );
				} )( start );
			} );
		}, { threshold: 0.5 } );
		els.forEach( function ( el ) { io.observe( el ); } );
	}

	/* ---------- görgetésjelző + fejléc árnyék ---------- */
	function initProgress() {
		var bar = document.querySelector( '.mhk-scroll-progress' );
		var header = document.querySelector( '.mhk-sticky-header' );
		if ( ! bar && ! header ) return;
		var queued = false;
		function update() {
			if ( bar ) {
				var max = document.documentElement.scrollHeight - window.innerHeight;
				bar.style.transform = 'scaleX(' + ( max > 0 ? window.scrollY / max : 0 ) + ')';
			}
			if ( header ) header.classList.toggle( 'mhk-scrolled', window.scrollY > 10 );
			queued = false;
		}
		window.addEventListener( 'scroll', function () {
			if ( ! queued ) { queued = true; requestAnimationFrame( update ); }
		}, { passive: true } );
		update();
	}

	/* ---------- katalógus: szűrés, keresés, rendezés ---------- */
	function initCatalog( root ) {
		var bar = ( root || document ).querySelector( '.mhk-filter-bar' );
		if ( ! bar || bar.dataset.mhkReady ) return;
		bar.dataset.mhkReady = '1';

		var grid = document.querySelector( '.mhk-catalog-section .mhk-product-grid' );
		if ( ! grid ) return;

		var cards = Array.prototype.slice.call( grid.querySelectorAll( '.mhk-p-card' ) );
		var buttons = Array.prototype.slice.call( bar.querySelectorAll( '.mhk-f-btn' ) );
		var countEl = bar.querySelector( '.mhk-f-count' );
		var searchEl = bar.querySelector( '.mhk-f-search' );
		var sortEl = bar.querySelector( '.mhk-f-select' );
		var key = 'mind';

		cards.forEach( function ( c, i ) { c.dataset.idx = i; } );

		function apply() {
			var q = ( searchEl ? searchEl.value : '' ).trim().toLowerCase();
			var n = 0;
			cards.forEach( function ( c ) {
				var okKey = key === 'mind' || c.dataset.brand === key || c.dataset.cat === key;
				var okQ = ! q || ( c.dataset.name || '' ).indexOf( q ) !== -1;
				var show = okKey && okQ;
				c.style.display = show ? '' : 'none';
				if ( show ) n++;
			} );
			buttons.forEach( function ( b ) { b.classList.toggle( 'mhk-active', b.dataset.filter === key ); } );
			if ( countEl ) countEl.textContent = n + ' modell';

			var mode = sortEl ? sortEl.value : 'default';
			var sorted = cards.slice().sort( function ( a, b ) {
				if ( mode === 'default' ) return a.dataset.idx - b.dataset.idx;
				var pa = a.dataset.price === '' ? Infinity : parseInt( a.dataset.price, 10 );
				var pb = b.dataset.price === '' ? Infinity : parseInt( b.dataset.price, 10 );
				if ( pa === Infinity && pb === Infinity ) return a.dataset.idx - b.dataset.idx;
				if ( pa === Infinity ) return 1;
				if ( pb === Infinity ) return -1;
				return mode === 'asc' ? pa - pb : pb - pa;
			} );
			sorted.forEach( function ( c ) { grid.appendChild( c ); } );
		}

		buttons.forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				key = b.dataset.filter;
				apply();
				if ( history.replaceState ) history.replaceState( null, '', '#' + key );
			} );
		} );
		if ( searchEl ) searchEl.addEventListener( 'input', apply );
		if ( sortEl ) sortEl.addEventListener( 'change', apply );

		var initial = ( location.hash || '' ).replace( '#', '' );
		if ( initial && buttons.some( function ( b ) { return b.dataset.filter === initial; } ) ) key = initial;
		apply();
	}

	/* ---------- űrlapok ---------- */
	function initForms( root ) {
		( root || document ).querySelectorAll( 'form.mhk-form' ).forEach( function ( form ) {
			if ( form.dataset.mhkReady ) return;
			form.dataset.mhkReady = '1';

			form.addEventListener( 'submit', function ( e ) {
				e.preventDefault();
				if ( typeof window.MHK === 'undefined' ) return;

				var msg = form.querySelector( '.mhk-form-msg' );
				var btn = form.querySelector( 'button[type=submit]' );
				var data = new FormData( form );
				data.append( 'action', 'mhk_submit' );
				data.append( 'nonce', window.MHK.nonce );
				data.append( 'form', form.dataset.form || 'ajanlat' );
				data.append( 'source', location.href );

				if ( btn ) { btn.disabled = true; btn.classList.add( 'mhk-loading' ); }
				if ( msg ) { msg.textContent = 'Küldés folyamatban…'; msg.className = 'mhk-form-msg'; }

				fetch( window.MHK.ajax, { method: 'POST', body: data, credentials: 'same-origin' } )
					.then( function ( r ) { return r.json().catch( function () { return { success: false }; } ); } )
					.then( function ( res ) {
						var ok = res && res.success;
						var text = ( res && res.data && res.data.message ) || ( ok ? 'Köszönjük!' : 'Hiba történt. Hívj minket telefonon!' );
						if ( msg ) {
							msg.textContent = text;
							msg.className = 'mhk-form-msg ' + ( ok ? 'mhk-ok' : 'mhk-err' );
						}
						if ( ok ) {
							form.reset();
							// Köszönőoldal: a hirdetési konverzió valódi
							// oldalletöltéshez kötve mérhető.
							if ( res.data && res.data.redirect ) {
								window.location.assign( res.data.redirect );
								return;
							}
						}
					} )
					.catch( function () {
						if ( msg ) { msg.textContent = 'Hálózati hiba. Kérlek, hívj minket telefonon!'; msg.className = 'mhk-form-msg mhk-err'; }
					} )
					.finally( function () {
						if ( btn ) { btn.disabled = false; btn.classList.remove( 'mhk-loading' ); }
					} );
			} );
		} );
	}

	/* ---------- mobil menü ---------- */
	function initNav() {
		var toggle = document.querySelector( '.mhk-nav-toggle' );
		if ( ! toggle ) return;

		var backdrop = document.querySelector( '.mhk-nav-backdrop' );
		var closeBtn = document.querySelector( '.mhk-nav-close' );

		function setMenu( open ) {
			document.body.classList.toggle( 'mhk-menu-open', open );
			toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			toggle.setAttribute( 'aria-label', open ? 'Menü bezárása' : 'Menü megnyitása' );
			if ( backdrop ) backdrop.hidden = ! open;
		}

		toggle.addEventListener( 'click', function () {
			setMenu( ! document.body.classList.contains( 'mhk-menu-open' ) );
		} );
		if ( backdrop ) backdrop.addEventListener( 'click', function () { setMenu( false ); } );
		if ( closeBtn ) closeBtn.addEventListener( 'click', function () { setMenu( false ); } );
		document.querySelectorAll( '.mhk-nav-links a' ).forEach( function ( a ) {
			a.addEventListener( 'click', function () { setMenu( false ); } );
		} );
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' ) setMenu( false );
		} );
	}

	/* ---------- felugró ajánlatkérő ablak ---------- */
	var lastFocus = null;

	function openModal( id ) {
		var m = document.getElementById( id );
		if ( ! m ) return;
		lastFocus = document.activeElement;
		m.hidden = false;
		document.body.classList.add( 'mhk-modal-open' );
		var first = m.querySelector( 'input:not([type=hidden]):not(.mhk-hp), textarea, button' );
		if ( first ) setTimeout( function () { first.focus(); }, 60 );
	}

	function closeModal( m ) {
		if ( ! m || m.hidden ) return;
		m.hidden = true;
		document.body.classList.remove( 'mhk-modal-open' );
		if ( lastFocus && lastFocus.focus ) lastFocus.focus();
	}

	function initModal( root ) {
		( root || document ).querySelectorAll( '[data-mhk-open]' ).forEach( function ( btn ) {
			if ( btn.dataset.mhkReady ) return;
			btn.dataset.mhkReady = '1';
			btn.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				openModal( btn.dataset.mhkOpen );
			} );
		} );

		( root || document ).querySelectorAll( '.mhk-modal' ).forEach( function ( m ) {
			if ( m.dataset.mhkReady ) return;
			m.dataset.mhkReady = '1';
			m.addEventListener( 'click', function ( e ) {
				if ( e.target.closest( '[data-mhk-close]' ) ) closeModal( m );
			} );
			// Fókusz ne szökjön ki az ablakból (billentyűzetes használat).
			m.addEventListener( 'keydown', function ( e ) {
				if ( e.key !== 'Tab' ) return;
				var f = m.querySelectorAll( 'a[href], button, input:not([type=hidden]):not(.mhk-hp), textarea, select' );
				if ( ! f.length ) return;
				var first = f[ 0 ], last = f[ f.length - 1 ];
				if ( e.shiftKey && document.activeElement === first ) { e.preventDefault(); last.focus(); }
				else if ( ! e.shiftKey && document.activeElement === last ) { e.preventDefault(); first.focus(); }
			} );
		} );
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' ) {
			document.querySelectorAll( '.mhk-modal:not([hidden])' ).forEach( closeModal );
		}
	} );

	/* ---------- süti-hozzájárulás ---------- */
	var CONSENT_KEY = 'mhk_consent2';

	function readConsent() {
		try { return localStorage.getItem( CONSENT_KEY ); } catch ( e ) { return null; }
	}

	function initConsent() {
		var bar = document.getElementById( 'mhk-cookie' );
		if ( ! bar ) return;

		window.mhkConsent = readConsent();
		if ( ! window.mhkConsent ) {
			setTimeout( function () { bar.hidden = false; }, 700 );
		}

		bar.querySelectorAll( '[data-mhk-consent]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var val = btn.dataset.mhkConsent;
				try { localStorage.setItem( CONSENT_KEY, val ); } catch ( e ) {}
				window.mhkConsent = val;
				bar.hidden = true;
				document.dispatchEvent( new CustomEvent( 'mhk:consent', { detail: val } ) );
			} );
		} );
	}

	/* ---------- ragadós szűrősáv a fejléc alá ---------- */
	function initStickyOffset() {
		var header = document.querySelector( '.mhk-sticky-header' );
		var bar = document.querySelector( '.mhk-filter-bar' );
		if ( ! header || ! bar ) return;
		function set() {
			var h = Math.round( header.getBoundingClientRect().height );
			var adminBar = document.getElementById( 'wpadminbar' );
			var extra = adminBar ? Math.round( adminBar.getBoundingClientRect().height ) : 0;
			bar.style.top = ( h + extra ) + 'px';
		}
		set();
		window.addEventListener( 'resize', set );
	}

	function initAll( root ) {
		initReveal( root );
		initSlider( root );
		initCounters( root );
		initCatalog( root );
		initForms( root );
		initModal( root );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', function () { initAll(); initProgress(); initNav(); initConsent(); initStickyOffset(); } );
	} else {
		initAll();
		initProgress();
		initNav();
		initConsent();
		initStickyOffset();
	}

	// Elementor szerkesztő élő előnézete.
	window.addEventListener( 'elementor/frontend/init', function () {
		if ( ! window.elementorFrontend || ! window.elementorFrontend.hooks ) return;
		window.elementorFrontend.hooks.addAction( 'frontend/element_ready/global', function ( $scope ) {
			initAll( $scope && $scope[ 0 ] ? $scope[ 0 ] : undefined );
		} );
	} );
} )();

/* Termékgaléria: kis képre kattintva cserél a főkép. */
(function () {
  var main = document.querySelector('.mhk-gal-main');
  var thumbs = document.querySelectorAll('.mhk-gal-thumb');
  if (!main || !thumbs.length) { return; }

  thumbs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var full = btn.getAttribute('data-full');
      if (!full || main.getAttribute('src') === full) { return; }
      main.style.opacity = '0';
      var img = new Image();
      img.onload = function () {
        main.setAttribute('src', full);
        main.style.opacity = '1';
      };
      img.src = full;
      thumbs.forEach(function (b) { b.classList.remove('mhk-active'); });
      btn.classList.add('mhk-active');
    });
  });

  main.style.transition = 'opacity .18s ease';
})();
