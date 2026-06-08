export const clamp = function(value, min, max) {
	return Math.max(min, Math.min(value, max));
};

export const getOrientedRect = function(startX, startY, endX, endY) {
	let actualStartX = 0;
	let actualStartY = 0;

	if (endX > startX) {
		actualStartX = startX;
	} else {
		actualStartX = endX;
	}

	if (endY > startY) {
		actualStartY = startY;
	} else {
		actualStartY = endY;
	}

	const rectWidth = Math.abs(endX - startX);
	const rectHeight = Math.abs(endY - startY);
	return { x : actualStartX, y : actualStartY, width : rectWidth, height : rectHeight }
}

export const getNormalizedRect = function(startX, startY, endX, endY, desiredWidth, desiredHeight) {
	const orientedRect = getOrientedRect(startX, startY, endX, endY)
	const normalizedStartX = clamp(orientedRect.x / desiredWidth,0,1);
	const normalizedStartY = clamp(orientedRect.y / desiredHeight,0,1);
	const normalizedEndX = clamp((orientedRect.x + orientedRect.width) / desiredWidth,0,1);
	const normalizedEndY = clamp((orientedRect.y + orientedRect.height) / desiredHeight,0,1);
	return {
		rect_left : normalizedStartX,
		rect_top : normalizedStartY,
		rect_right : normalizedEndX,
		rect_bottom : normalizedEndY,
	}
}