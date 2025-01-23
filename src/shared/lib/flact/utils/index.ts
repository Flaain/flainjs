export const isPrimitive = (x: any) => typeof x !== 'object';
export const arrayfy = (data: any) => (!data ? [] : Array.isArray(data) ? data : [data]);
export const createText = (v: string) => ({ type: '#text', props: { nodeValue: v + '' } });
export const flat = (arr: Array<any>, target: Array<any> = []) => {
    arr.forEach((v) => Array.isArray(v) ? flat(v, target) : target.push(isPrimitive(v) ? createText(v) : v));

    return target
}