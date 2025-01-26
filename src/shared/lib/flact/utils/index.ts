import { PRIORITY_LEVEL, Task } from "../model/types";

export const isPrimitive = (x: any) => typeof x !== 'object';
export const arrayfy = (data: any) => (!data ? [] : Array.isArray(data) ? data : [data]);
export const createText = (v: string) => ({ type: '#text', props: { nodeValue: v + '' } });
export const createTask = (callback: () => void, priority: PRIORITY_LEVEL): Task => ({ callback, priority, retries: 0, created_at: Date.now() });
export const flat = (arr: Array<any>, target: Array<any> = []) => {
    arr.forEach((v) => Array.isArray(v) ? flat(v, target) : target.push(isPrimitive(v) ? createText(v) : v));

    return target
}