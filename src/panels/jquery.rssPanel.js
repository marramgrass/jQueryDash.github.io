/**
 * @author Sam Thompson
 *
 * Panel for handling rss feeds
 */
$( function()
{
	"use strict";
	//noinspection JSUnresolvedVariable
	$.widget( 'jqueryDash.rssPanel', $.jqueryDash.panel, {

		options: {
			refreshable: true,
			minHeight: 50,
			minWidth: 400,
			showItemTitle: true,
			url: '',
			maxEntries: 5,
			contentHashed: null,
			slideTimer: null,
			_minEditorSize: {
				h: 150,
				w: 200
			},
			timePerItem: 10
		},

		/**
		 * Add settings fields for edit mode
		 *
		 * @private
		 */
		_createEditorFields: function()
		{
			this._super();
			this.addEditorField( 'bool', 'showItemTitle', (this.options.showItemTitle ? 1 : 0), 'Display Title' );
			this.addEditorField( 'text', 'url', this.options.url, 'Source URL' );
			this.addEditorField( 'text', 'maxEntries', this.options.maxEntries, 'Max Entries' );
			this.addEditorField(
				'select',
				'slideTime',
				this.options.timePerItem,
				'Time per item', { 'options': [
					{'value': 5, 'display': '5 seconds'},
					{'value': 10, 'display': '10 seconds'},
					{'value': 30, 'display': '30 seconds'},
					{'value': 60, 'display': '1 minute'},
					{'value': 300, 'display': '5 minutes'}
				] } );
		},

		/**
		 *
		 * @param {jQuery} slideObject
		 * @returns {text}
		 * @private
		 */
		_createSlideContent: function( slideObject )
		{
			return slideObject.find( 'description' ).text();
		},

		/**
		 * Clears the timer and current time values when the view is destroyed
		 *
		 * @private
		 */
		_destroyViewPanel: function()
		{
			this._super();
			this.options.contentHashed = null;
			this.element
				.removeClass( 'slides' )
				.find( 'div.content' )
				.removeAttr( 'style' );
			clearInterval( this.options.slideTimer );
		},

		/**
		 * Update the show seconds flag
		 *
		 * @private
		 */
		_readSettings: function()
		{
			this._super();
			this.options.showItemTitle = parseInt( this.setting( 'showItemTitle' ), 10 ) === 1;
			this.options.url = this.setting( 'url' );
			this.options.maxEntries = this.setting( 'maxEntries' );
			this.options.timePerItem = parseInt( this.setting( 'slideTime' ), 10 ) * 1000;
		},

		refreshContent: function()
		{
			var
				self = this,
				refreshEnabled = this._super();

			if( this.isSetting( 'url' ) && this.setting( 'url' ) !== '' )
			{
				this.sendGetRequest(
					this.options.url,
					'application/xml',
					function( request )
					{
						var
							xml,
							entries,
							maxEntry,
							entryIterator,
							hash = '',
							entryObjects = {},
							content,
							slideWidth,
							slideDom;

						switch( request.readyState )
						{
							case XMLHttpRequest.OPENED:
								if( self.options.contentHashed === null )
								{
									self.element.find( 'div.content' ).text( 'Loading...' );
								}
								break;
							case XMLHttpRequest.DONE:
								xml = request.responseXML;
								if( xml === null )
								{
									if( self.options.contentHashed === null )
									{
										self.element.find( 'div.content' ).text( 'Unable to load feed source' );
									}
									return;
								}
								entries = xml.getElementsByTagName( 'item' );
								if( entries.length === 0 )
								{
									if( self.options.contentHashed === null )
									{
										self.element.find( 'div.content' ).text( 'Feed has no items' );
									}
									return;
								}
								maxEntry =
								entries.length > self.options.maxEntries ? self.options.maxEntries : entries.length;
								for( entryIterator = 0; entryIterator < maxEntry; entryIterator = entryIterator + 1 )
								{
									entryObjects[ entryIterator ] = $( entries.item( entryIterator ) );

									// Hash content if this is refreshable, to determine if we need to redraw the panel
									if( refreshEnabled )
									{
										hash += self.hash( entryObjects[ entryIterator ].text() );
									}
								}

								if( !refreshEnabled || hash !== self.options.contentHashed )
								{
									if( refreshEnabled )
									{
										self.options.contentHashed = hash;
									}
									self.element.addClass( 'slides' );
									content = self.element.find( 'div.content' ).html( '' );
									slideWidth = self.element.innerWidth() - 4;
									for( entryIterator = 0; entryIterator < maxEntry;
										 entryIterator = entryIterator + 1 )
									{
										slideDom = $( '<div/>', {
											'class': 'slide item' + entryIterator,
											'style': 'width:' + slideWidth + 'px'
										} );
										if( self.options.showItemTitle )
										{
											slideDom.append(
												$( '<div/>', { 'class': 'title' } )
													.append(
														$( '<a/>', {
															'text': entryObjects[ entryIterator ].find( 'title' ).text(),
															'href': entryObjects[ entryIterator ].find( 'link' ).text(),
															'target': '_blank'
														} )
													)
											);
										}
										slideDom.append( self._createSlideContent( entryObjects[ entryIterator ] ) );
										content.append( slideDom );
									}
									content
										.css( 'width', slideWidth * maxEntry );

									// If the slides are being refreshed, we'll need to remove the old timer.
									if( self.options.slideTimer !== null )
									{
										clearInterval( self.options.slideTimer );
									}

									self.options.slideTimer = setInterval( function()
									{
										var leftPos = self.element.scrollLeft();

										if( leftPos + slideWidth < content.width() )
										{
											self.element.scrollLeft( self.element.scrollLeft() + slideWidth );
										}
										else
										{
											self.element.scrollLeft( 0 );
										}
									}, self.options.timePerItem );
								}
								break;
						}
					}
				);
			}
			else
			{
				this.element.find( 'div.content' ).text( 'Invalid Source URL' );
			}
		}

	} );
} );