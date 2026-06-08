// function for chunking array to make row distribution easier
export const arrayChunk = function(arr, n) {
	const array = arr.slice();
	const chunks = [];
	while (array.length) chunks.push(array.splice(0, n));
	return chunks;
};