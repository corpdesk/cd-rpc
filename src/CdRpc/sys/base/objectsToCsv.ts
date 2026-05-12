function getKeys(obj, prefix = '') {
	if (typeof obj === 'undefined' || obj === null) return [];
	return [
		...Object.keys(obj).map(key => `${prefix}${key}`),
		...Object.entries(obj).reduce((acc, [key, value]) => {
			if (typeof value === 'object') return [...acc, ...getKeys(value, `${prefix}${key}.`)];
			return acc;
		}, []),
	];
}
function flatObject(obj, prefix = '') {
	if (typeof obj === 'undefined' || obj === null) return {};
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (typeof value === 'object') return { ...acc, ...flatObject(value, `${prefix}${key}.`) };
		return { ...acc, [`${prefix}${key}`]: value };
	}, {});
}

function escapeCsvValue(cell) {
	if (cell.replace(/ /g, '').match(/[\s,"]/)) {
		return '"' + cell.replace(/"/g, '""') + '"';
	}
	return cell;
}

export default function objectsToCsv(arrayOfObjects) {
	// collect all available keys
	const keys = new Set(arrayOfObjects.reduce((acc, item) => [...acc, ...getKeys(item)], []));
	// for each object create all keys
	const values = arrayOfObjects.map(item => {
		const fo = flatObject(item);
		const val = Array.from(keys).map((key: string) => (key in fo ? escapeCsvValue(`${fo[key]}`) : ''));
		return val.join(',');
	});
	return `${Array.from(keys).join(',')}\n${values.join('\n')}`;
}