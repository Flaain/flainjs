import { Fiber, PRIORITY_LEVEL, Task, UseQueryReducerAction, UseQueryReducerState, UseQueryTypes } from "../model/types";

export const getKey = (v: Fiber): string => `${v?.key}_${isFunction(v?.type) ? v.type.name : v?.type}`;
export const isPrimitive = (v: unknown): v is string | number => typeof v === 'string' || typeof v === 'number';
export const isFunction = (v: unknown): v is Function => typeof v === 'function';
export const arrayfy = (data?: unknown) => (!data ? [] : Array.isArray(data) ? data : [data]);
export const createText = (v: string | number) => ({ type: 'text', props: { nodeValue: v + '' } });
export const createTask = (callback: () => void, priority?: PRIORITY_LEVEL): Task => ({ callback, priority, retries: 0, created_at: Date.now() });
export const handleFCreturn = (v: any) => isPrimitive(v) ? createText(v) : v;
export const isDepsChanged = (a: Array<any>, b: ReadonlyArray<any>) => !a || a.length !== b.length || b.some((v, i) => !Object.is(v, a[i]));
export const errorAction = (error: unknown): Extract<UseQueryReducerAction, { type: UseQueryTypes.ERROR }> => ({ type: UseQueryTypes.ERROR, payload: { error } });

export const flat = (arr: Array<any>, target: Array<any> = []) => {
    arr.forEach((v) => Array.isArray(v) ? flat(v, target) : v !== null && typeof v !== 'boolean' && target.push(isPrimitive(v) ? createText(v) : v));

    return target
};

export const deepEqual = (x: unknown, y: unknown) => {
    if (typeof x !== "object" || x === null || typeof y !== "object" || y === null) return Object.is(x, y);

    if (x === y) return true;

    if (Array.isArray(x)) {
        if (!Array.isArray(y) || x.length !== y.length) return false;

        for (let i = 0; i < x.length; i += 1) if (!deepEqual(x[i], y[i])) return false;
    } else {
        if (Array.isArray(y)) return false;

        const keys = Object.keys(x);

        if (Object.keys(y).length !== keys.length) return false;

        for (const key of keys) if (!Object.prototype.propertyIsEnumerable.call(y, key) || !deepEqual(x[key as keyof typeof x], y[key as keyof typeof y])) return false;
    }

    return true;
}

export const queryReducer = <T>(state: UseQueryReducerState<T>, action: UseQueryReducerAction<T>) => {
    switch (action.type) {
        case UseQueryTypes.LOADING:
            return { ...state, isLoading: action.payload.isLoading };
        case UseQueryTypes.SUCCESS:
            return { ...state, data: action.payload.data, isSuccess: true, isLoading: false, isRefetching: false, isError: false, error: undefined };
        case UseQueryTypes.SET:
            return { ...state, data: action.payload.data };
        case UseQueryTypes.REFETCH:
            return { ...state, isRefetching: action.payload.isRefething };
        case UseQueryTypes.ERROR:
            return { ...state, error: action.payload.error, isError: true, isSuccess: false, isRefetching: false, isLoading: false };
        case UseQueryTypes.RESET:
            return { ...state, ...action.payload };
        default:
            return state;
    }
};