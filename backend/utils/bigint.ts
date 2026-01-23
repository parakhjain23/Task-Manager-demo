export function stringifyBigInt<T>(obj: T): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(stringifyBigInt);
    }

    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = stringifyBigInt((obj as any)[key]);
        }
        return newObj;
    }

    return obj;
}
