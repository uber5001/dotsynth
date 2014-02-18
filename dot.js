/**
 * Creates a new dot with all of its DOM elements
 */
function dot(definition, x, y) {
	var selfDot = this;
	var parent = this.parentElement = document.body;
	this.definition = definition;
	this.connections = [];
	this.node = definition.create();
	this.svgElement = document.createElementNS(NS, "svg");
	this.svgElement.setAttributeNS(null, 'width', SVG_SIZE + UNITS);
	this.svgElement.setAttributeNS(null, 'height', SVG_SIZE + UNITS);
	this.svgElement.setAttributeNS(null, 'viewBox','0 0 ' + SVG_SIZE + ' ' + SVG_SIZE);
	this.svgElement.style.position = "absolute";
	parent.appendChild(this.svgElement);
	
	Object.defineProperty(this, 'x', {
		get: function() {
			return x;
		},
		set: function(val) {
			x = val;
			this.svgElement.style.left = (x - SVG_SIZE/2) + UNITS;
			for (var i = 0; i < selfDot.connections.length; i++) {
				selfDot.connections[i].redraw();
			}
		}
	});
	Object.defineProperty(this, 'y', {
		get: function() {
			return y;
		},
		set: function(val) {
			y = val;
			this.svgElement.style.top = (y - SVG_SIZE/2) + UNITS;
			for (var i = 0; i < selfDot.connections.length; i++) {
				selfDot.connections[i].redraw();
			}
		}
	});
	this.x = x;
	this.y = y;
	
	//Center Dot
	this.centerElement = document.createElementNS(NS, 'circle');
	this.centerElement.setAttributeNS(null, 'cx', SVG_SIZE/2);
	this.centerElement.setAttributeNS(null, 'cy', SVG_SIZE/2);
	this.centerElement.setAttributeNS(null, 'r', DOT_RADIUS);
	this.centerElement.setAttributeNS(null, 'fill', 'hsla( ' + definition.hue + ', 100%, ' + DOT_LIGHTNESS + ', 1)');
	this.centerElement.classList.add('dotcenter');
	this.svgElement.classList.add('dotsvg');
	this.centerElement.object = this;
	
	//end Center Dot

	this.arcs = [];
	
	var paramList = definition.parameters
	for (var i = 0; i < paramList.length; i++) {
		var endAngle = 3*Math.PI/2 - i/paramList.length * 2*Math.PI;
		var startAngle = endAngle  - 1/paramList.length * 2*Math.PI;
		if (startAngle < 0) {
			startAngle += 2*Math.PI;
			endAngle += 2*Math.PI;
		}
		this.arcs.push(new arc(this.svgElement, startAngle, endAngle, paramList[i]));
	}
	
	this.svgElement.appendChild(this.centerElement);
	
	this.nameElement = document.createElementNS(NS, 'text');
	this.nameElement.setAttributeNS(null, 'x', SVG_SIZE/2);
	this.nameElement.setAttributeNS(null, 'y', SVG_SIZE/2);
	this.nameElement.setAttributeNS(null, 'text-anchor', 'middle');
	this.nameElement.setAttributeNS(null, 'dominant-baseline', 'middle');
	this.nameElement.setAttributeNS(null, 'font-size', DOT_NAME_SIZE);
	this.nameElement.setAttributeNS(null, 'fill', 'black');
	this.nameElement.innerHTML = definition.shortName;
	this.svgElement.appendChild(this.nameElement);
	
	var isOpen = false;
	this.open = function() {
		console.log('open');
		isOpen = true;
		this.svgElement.classList.add('opened');
	}
	this.close = function() {
		console.log('close');
		isOpen = false;
		this.svgElement.classList.remove('opened');
	}
	this.toggle = function() {
		if (isOpen) selfDot.close();
		else selfDot.open();
	}
	//TOUCH
	var touchId = null;
	function onTouchStart(e) {
		if (touchId == null) {
			var targetTouch = e.targetTouches[0];
			touchId = targetTouch.identifier;
			console.log('begin touch!');
			document.addEventListener('touchmove', onTouchMove);
			document.addEventListener('touchend', onTouchEnd);
			var initialPos = {
				x:targetTouch.pageX,
				y:targetTouch.pageY
			}
			var hold = false;
			var drag = false;
			var conn = null;
			var touchTime = setTimeout(function() {
				hold = true;
				//TODO: hold effect
				navigator.vibrate(HOLD_EFFECT_VIBRATE_TIME);
				console.log('begin hold!');
			}, TAP_TIMEOUT);
			e.preventDefault();
		}
		function onTouchMove(e) {
			var targetTouch = findTouch(touchId, e.changedTouches);
			if (targetTouch !== null) {
				if (!drag) {
					//test for dragging
					var dx = pxToMm(targetTouch.pageX - initialPos.x)
					var dy = pxToMm(targetTouch.pageY - initialPos.y)
					
					//check if exited dragbox
					if ( Math.abs(dy) > DRAG_BOX_SIZE/2 || Math.abs(dx) > DRAG_BOX_SIZE/2 ) {
						drag = true;
						clearTimeout(touchTime);
						//TODO: begin drag effects
						console.log('begin drag!');
						if (hold) {
							//begin hold drag
							conn = new connection(selfDot);
						} else {
							//begin normal drag
						}
					}
				} else {
					//drag stuffs
					if (hold) {
						//TODO: middle of hold drag
						conn.endAt(pxToMm(targetTouch.pageX), pxToMm(targetTouch.pageY));
					} else {
						//TODO: middle of normal drag
						//move dot
						selfDot.x = pxToMm(targetTouch.pageX);
						selfDot.y = pxToMm(targetTouch.pageY);
					}
				}
				e.preventDefault();
			}
		}
		function onTouchEnd(e) {
			var targetTouch = findTouch(touchId, e.changedTouches);
			if (targetTouch !== null) {
				touchId = null;
				clearTimeout(touchTime);
				if (drag) {
					if (hold) {
						//TODO: end of hold drag
						conn.finalize(document.elementFromPoint(targetTouch.clientX, targetTouch.clientY));
					} else {
						//TODO: end of normal drag
					}
				} else { // tap / hold
					if (hold) {
						//TODO: end of hold
					} else {
						//TODO: end of tap
						selfDot.toggle();
					}
				}
				document.removeEventListener('touchmove', onTouchMove);
				document.removeEventListener('touchend', onTouchEnd);
				e.preventDefault();
			}
			//if dot is over trash can, delete it?
			// else if() {

			// }
		}
	}
	this.centerElement.addEventListener('touchstart', onTouchStart);
	
	//MOUSE
	this.centerElement.addEventListener('mousedown', function() {
	});
	this.centerElement.addEventListener('mousemove', function() {
	});
	this.centerElement.addEventListener('mouseup', function() {
	});
	
	function arc(parent, start, end, definition) {		
		var selfArc = this;
		this.definition = definition;
		this.paramName = definition.name;
		
		var clipPathId = CLIP_PATH_ID++;
		this.pathElement = document.createElementNS(NS, 'path');
		this.pathElement.classList.add('arc');
		this.pathElement.setAttributeNS(null, 'stroke', 'hsla( 0, 0%, ' + EMPTY_ARC_LIGHTNESS + ', ' + EMPTY_ARC_ALPHA + ')');
		this.pathElement.setAttributeNS(null, 'fill', "none");
		this.pathElement.setAttributeNS(null, 'stroke-width', ARC_WIDTH);
		this.pathElement.setAttributeNS(null, 'clip-path', "url(#clip" + clipPathId + ")");
		
		//Making the path's 'd'
		if( ( end - start ) > 6 /* AKA 2pi */) {	//has one parameter
			var str = "M "+SVG_SIZE/2+" "+(SVG_SIZE/2 - ARC_RADIUS)+"\n";	
			str += "A "+ARC_RADIUS+" "+ARC_RADIUS+" 0 0 0 "+(SVG_SIZE/2)+" "+(SVG_SIZE/2 + ARC_RADIUS)+"\n";
			str += "A "+ARC_RADIUS+" "+ARC_RADIUS+" 0 0 0 "+(SVG_SIZE/2)+" "+(SVG_SIZE/2 - ARC_RADIUS)+"\n";
		} else {	//has 1+ parameters
			var endPoint = polarToCartesian(ARC_RADIUS, end, SVG_SIZE/2, SVG_SIZE/2);
			var startPoint = polarToCartesian(ARC_RADIUS, start, SVG_SIZE/2, SVG_SIZE/2);			
			var str = "M "+endPoint.x+" "+endPoint.y+"\n";
			str += "A "+ARC_RADIUS+" "+ARC_RADIUS+" 0 0 0 "+startPoint.x+" "+startPoint.y+"\n";
		}
		this.pathElement.setAttributeNS(null, 'd', str);
		
		this.clipPathElement = document.createElementNS(NS, 'clipPath');
		this.clipPathElement.setAttributeNS(null, 'id', 'clip'+clipPathId);
		
		this.clipPathsPathElement = document.createElementNS(NS, 'path');
		
		//Making the clipPath's 'd'
		if( ( end - start ) > 6 /* AKA 2pi */) {	//has one parameter
			this.clipOrigin = {x:SVG_SIZE/2 ,y:SVG_SIZE/2};
			var str = "M 0 0\n";
			str += "L "+(SVG_SIZE/2 - GAP_WIDTH/2)+" 0\n";
			str += "L "+(SVG_SIZE/2 - GAP_WIDTH/2)+" "+(SVG_SIZE/2)+"\n";
			str += "L "+(SVG_SIZE/2 + GAP_WIDTH/2)+" "+(SVG_SIZE/2)+"\n";
			str += "L "+(SVG_SIZE/2 + GAP_WIDTH/2)+" 0\n";
			str += "L "+SVG_SIZE+" 0\n";
			str += "L "+SVG_SIZE+" "+SVG_SIZE+"\n";
			str += "L 0 "+SVG_SIZE+"\n";
			//completes back to (0,0)
		} else {	//has 1+ parameters
			var offsetOrigin = polarToCartesian( (GAP_WIDTH/2) / (Math.sin( (end-start)/2) ) , (end+start)/2, SVG_SIZE/2, SVG_SIZE/2);
			this.clipOrigin = offsetOrigin;
			var str = "M "+offsetOrigin.x+" "+offsetOrigin.y+"\n";
			var endPoint = polarToCartesian(SVG_SIZE/2, end, offsetOrigin.x, offsetOrigin.y);
			var startPoint = polarToCartesian(SVG_SIZE/2, start, offsetOrigin.x, offsetOrigin.y);
			str += "L "+endPoint.x+" "+endPoint.y+"\n";
			str += "A "+SVG_SIZE/2+" "+SVG_SIZE/2+" 0 0 0 "+startPoint.x+" "+startPoint.y+"\n";
		}
		this.clipPathsPathElement.setAttributeNS(null, 'd', str);
		
		this.clipPathElement.appendChild(this.clipPathsPathElement);
		
		this.indicatorElement = document.createElementNS(NS, 'path');
		this.indicatorElement.classList.add('arc');
		this.indicatorElement.setAttributeNS(null, 'fill', 'hsla(' + selfArc.definition.hue + ', 100%, ' + FILL_ARC_LIGHTNESS + ', 1)');
		this.indicatorElement.setAttributeNS(null, 'stroke', 'hsla(' + selfArc.definition.hue + ', 100%, ' + STROKE_ARC_LIGHTNESS + ', 1)');
		this.indicatorElement.style['pointer-events'] = 'none';
		function drawIndicator(percent) {
			var str = "M " + selfArc.clipOrigin.x + " " + selfArc.clipOrigin.y;
			var endAngle = start + (end - start)*percent;
			var startAngle = start;
			var endPoint = polarToCartesian(SVG_SIZE/2, endAngle, selfArc.clipOrigin.x, selfArc.clipOrigin.y);
			var startPoint = polarToCartesian(SVG_SIZE/2, startAngle, selfArc.clipOrigin.x, selfArc.clipOrigin.y);
			str += "L "+endPoint.x+" "+endPoint.y+"\n";
			if (endAngle - startAngle > Math.PI) {
				//need 2 arcs, add halfway angle
				var halfwayPoint = polarToCartesian(SVG_SIZE/2, (startAngle+endAngle)/2, selfArc.clipOrigin.x, selfArc.clipOrigin.y);
				str += "A "+SVG_SIZE/2+" "+SVG_SIZE/2+" 0 0 0 "+halfwayPoint.x+" "+halfwayPoint.y+"\n";
			}
			str += "A "+SVG_SIZE/2+" "+SVG_SIZE/2+" 0 0 0 "+startPoint.x+" "+startPoint.y+"\n";
			selfArc.indicatorElement.setAttributeNS(null, 'd', str);
		}
		drawIndicator(.5);
		
		//create our double-clip path
		
		this.doubleClipPathElement = document.createElementNS(NS, 'clipPath');
		this.doubleClipPathsPathElement = document.createElementNS(NS, 'path');
		this.doubleClipPathsPathElement.setAttributeNS(null, 'fill-rule', 'evenodd');
		var str = "M " + (SVG_SIZE/2) + " " + (SVG_SIZE/2 - DOT_RADIUS - GAP_WIDTH) + "\n";
		str += "A " + (DOT_RADIUS+GAP_WIDTH) + " " + (DOT_RADIUS+GAP_WIDTH) + " 0 0 0 " + (SVG_SIZE/2) + " " + (SVG_SIZE/2 + DOT_RADIUS + GAP_WIDTH) + "\n";
		str += "A " + (DOT_RADIUS+GAP_WIDTH) + " " + (DOT_RADIUS+GAP_WIDTH) + " 0 0 0 " + (SVG_SIZE/2) + " " + (SVG_SIZE/2 - DOT_RADIUS - GAP_WIDTH) + "\n";
		str += "M " + (SVG_SIZE/2) + " " + (SVG_SIZE/2 - DOT_RADIUS - GAP_WIDTH - ARC_WIDTH) + "\n";
		str += "A " + (DOT_RADIUS+GAP_WIDTH+ARC_WIDTH) + " " + (DOT_RADIUS+GAP_WIDTH+ARC_WIDTH) + " 0 0 1 " + (SVG_SIZE/2) + " " + (SVG_SIZE/2 + DOT_RADIUS + GAP_WIDTH + ARC_WIDTH) + "\n";
		str += "A " + (DOT_RADIUS+GAP_WIDTH+ARC_WIDTH) + " " + (DOT_RADIUS+GAP_WIDTH+ARC_WIDTH) + " 0 0 1 " + (SVG_SIZE/2) + " " + (SVG_SIZE/2 - DOT_RADIUS - GAP_WIDTH - ARC_WIDTH) + "\n";
		this.doubleClipPathsPathElement.setAttributeNS(null, 'd', str);
		this.doubleClipPathElement.appendChild(this.doubleClipPathsPathElement);
		this.doubleClipPathElement.setAttributeNS(null, 'id', 'doubleClip' + clipPathId);
		this.doubleClipPathElement.setAttributeNS(null, 'clip-path', 'url(#clip'+clipPathId+')');
		this.indicatorElement.setAttributeNS(null, 'clip-path', 'url(#doubleClip' + clipPathId + ')');
		
		
		parent.appendChild(this.doubleClipPathElement);
		parent.appendChild(this.pathElement);
		parent.appendChild(this.indicatorElement);
		parent.appendChild(this.clipPathElement);
		
		function polarToCartesian(radius, angle, originX, originY) {
			return {
				x: originX + radius * Math.cos(angle),
				y: originY + radius * Math.sin(angle)
			}
		}
		function cartesianToPolar(x, y, originX, originY) {
			x -= originX;
			y -= originY;
			return {
				radius: Math.sqrt( x*x + y*y ),
				angle: Math.atan( y / x ) + (x<0) ? Math.PI : 0
			}
		}
		
		
		/**
		 * Using this arc's this.clipOrigin, and a point, figure out the
		 * direction that point is from that origin.
		 *
		 * The x and y coords are in px, where the top left corner of the
		 * document is the origin.
		 *
		 * The clip origin is in mm, and relative to the top left corner
		 * of this arc's SVG.
		 */
		function calculateAngle(x, y) {
			var svg = parent;
			var origin = positionOf(svg);
			origin.x += mmToPx(selfArc.clipOrigin.x);
			origin.y += mmToPx(selfArc.clipOrigin.y);
			
			//now both are relative to top left of doc AND both in px
			var angle = Math.atan((y-origin.y)/(x-origin.x));
			if (x-origin.x < 0) {
				angle += Math.PI;
			}
			if (angle < 0) {
				angle += 2*Math.PI;
			}
			return angle;
		}
		
		/**
		 * Tries to change the position of the arc's value indicator
		 *
		 * The x and y coords are relative to the top left of the doc.
		 */
		function modifyValue(x, y) {
			var angle = calculateAngle(x, y);
			if (angle < start) angle += 2*Math.PI;
			var halfwayAngle = (start+end)/2 + Math.PI;
			if (angle > end) { //if out of range
				if (angle > halfwayAngle) {
					//wrap-around
					angle = start;
				} else {
					angle = end;
				}
			}
			var percent = (angle-start)/(end-start);
			selfDot.node[selfArc.definition.name].value = selfArc.definition.scale(percent);
			drawIndicator(percent);
		}
		//EVENTS FOR THE ARC
		
		//TOUCH
		var touchId = null;
		function onTouchStart(e) {
			if (touchId == null) {
				touchId = e.targetTouches[0].identifier;
				targetTouch = e.targetTouches[0];
				modifyValue(targetTouch.pageX, targetTouch.pageY);
				document.addEventListener('touchmove', onTouchMove);
				document.addEventListener('touchend', onTouchEnd);
				e.preventDefault();
			}
			function onTouchMove(e) {
				var targetTouch = findTouch(touchId, e.changedTouches);
				if (targetTouch !== null) {
					modifyValue(targetTouch.pageX, targetTouch.pageY);
					e.preventDefault();
				}
			}
			function onTouchEnd(e) {
				var targetTouch = findTouch(touchId, e.changedTouches);
				if (targetTouch !== null) {
					touchId = null;
					modifyValue(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
					document.removeEventListener('touchmove', onTouchMove);
					document.removeEventListener('touchend', onTouchEnd);
					e.preventDefault();
				}
			}
		}
		this.pathElement.addEventListener('touchstart', onTouchStart);
		
		//MOUSE
		this.pathElement.addEventListener('mousedown', function() {
		});
		this.pathElement.addEventListener('mousemove', function() {
		});
		this.pathElement.addEventListener('mouseup', function() {
		});
	}
	
	/**
	 * helper funcs for mm to px and px to mm
	 *
	 * MUST be in dot. uses svg for reference
	 */
	function mmToPx(val) {
		return val * selfDot.svgElement.offsetHeight / SVG_SIZE;
	}
	function pxToMm(val) {
		return val / ( selfDot.svgElement.offsetHeight / SVG_SIZE );
	}
}


/**
 * helper func to get pos of element
 */
function positionOf(element) {
	if (element == document.body) return {x:0, y:0};
	var position = positionOf(element.offsetParent);
	position.x += element.offsetLeft;
	position.y += element.offsetTop;
	return position;
}

/**
 * Finds and returns a Touch of id from list
 */
function findTouch(id, list) {
	for (var i = 0; i < list.length; i++) {
		if (list[i].identifier === id)
			return list[i];
	}
	return null;
}