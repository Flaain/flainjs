export type RootFiber = Pick<Fiber, 'props' | 'child' | 'children' | 'is_dirty' | 'is_comp' | 'node'> & { type: Extract<VNodeType, 'root'> }; 
export type VNodeType = keyof HTMLElementTagNameMap | "text" | "root" | "svg" | FC;
export type EffectType = 'effect' | 'layout';
export type EffectCallback = () => void | (() => void);
export type FlaNode = VNode | Array<VNode> | boolean | null | undefined;
export type DependencyList = ReadonlyArray<unknown>;
export type Ref<T = any> = ((node: T | null) => void) | { current: T | null };
export type RefObject<T> = { current: T };
export type Reducer<S, A> = (state: S, action: A) => S;
export type ReducerWithoutAction<S> = (state: S) => S;
export type SetStateAction<S> = S | ((prevState: S) => S);
export type Initializer<S> = () => S;
export type Dispatch<V> = (value: V) => void;
export type PropsWithChildren = { children: FlaNode };

export enum FLACT_ERRORS {
    REF_STATE_ASSIGNMENT_DENIED = "Property assignment denied: Cannot define a non-existent property in REF\nAllowed properties: current",
    APP_CONTAINER = "App container is missing",
    USE_QUERY_SETTER = "Cannot use dispatch without initial data",
    USE_QUERY_NO_CALLBACK = "Query callback is missing",
    USE_MUTABLE_STATE_NOT_OBJECT = 'Cannot use mutable state with non-object initial state',
}

export enum PRIORITY_LEVEL {
    NO = 0,
    IMMEDIATE = 1,
    USER_BLOCK = 1 << 1,
    NORMAL = 1 << 2,
    LOW = 1 << 3,
    IDLE = 1 << 4,
}

export enum EFFECT_TAG {
    UPDATE = 1 << 1,
    INSERT = 1 << 2,
    REMOVE = 1 << 3,
    SVG = 1 << 4,
    DIRTY = 1 << 5,
    MOVE = 1 << 6,
    REPLACE = 1 << 7,
}

export interface FC<P extends Attributes = {}> {
    (props: P): VNode<P> | null;
    fiber?: Fiber;
    type?: string;
    memo?: boolean;
    shouldUpdate?: (newProps: P, oldProps: P) => boolean;
}

export interface Action {
    type: Exclude<EFFECT_TAG, EFFECT_TAG.DIRTY | EFFECT_TAG.SVG>;
    before?: Fiber | null;
}


export interface Attributes extends Record<string, any> {
    children?: FlaNode;
    ref?: Ref | null;
    key?: string | null;
}

export interface VNode<P extends Attributes = any, T = VNodeType> {
    type: T;
    props?: P;
    ref?: Ref | null;
    key?: string | null;
}

export interface Task {
    callback: () => any;
    retries: number;
    created_at: number;
    priority?: PRIORITY_LEVEL;
}

export interface Hook {
    cursor: number;
    list: Array<any>;
    layout: Array<any>;
    effect: Array<any>;
}


export interface Fiber<P extends Attributes = any> {
    key?: null | string;
    type: VNodeType;
    node?: any;
    children?: any;
    related_with?: Fiber;
    is_dirty: boolean;
    effect_tag?: EFFECT_TAG;
    parent?: Fiber<P>;
    parent_node?: HTMLElement;
    sibling?: Fiber<P>;
    child?: Fiber<P>;
    alternate?: Fiber<P>;
    ref?: Ref;
    hooks?: Hook;
    action?: Action | null;
    props?: P;
    lane?: number;
    is_comp?: boolean;
}

export interface INTERNAL_STATE {
    root_fiber: RootFiber | null;
    current_fiber: Fiber | null;
    scheduler: {
        queue: Array<Task>;
        channel: MessageChannel | null;
        expires_at: number;
    };
}

/* useQuery types */
export type UseQueryCallback<T> = (params: { signal: AbortSignal }) => Promise<T>;

export interface UseQueryOptions<T> {
    keys: DependencyList;
    retry: boolean | number;
    enabled: boolean;
    refetchInterval: number;
    retryDelay: number;
    onSuccess: (data: T) => void;
    onSelect: (data: T) => void;
    onError: (error: unknown) => void;
}

export enum UseQueryTypes {
    LOADING = 'loading',
    SUCCESS = 'success',
    SET = 'set',
    REFETCH = 'refetch',
    RESET = 'reset',
    ERROR = 'error',
}

export interface UseQueryConfig {
    currentAction: UseRunQueryAction | null;
    abortController: AbortController;
    retry: number;
    requested: boolean;
    mounted: boolean;
    interval: ReturnType<typeof setInterval> | null;
    timeout: ReturnType<typeof setTimeout> | null;
}
  
export type UseQueryReturn<T> = {
    isLoading: boolean;
    isRefetching: boolean;
    call: () => Promise<void>;
    abort: () => void;
    setData: (v: SetStateAction<Partial<T>>) => void;
    refetch: () => void;
    isSuccess: boolean;
    isError: boolean;
    data?: T;
    error?: unknown;
};
  
export interface UseQueryReducerState<T> {
    data?: T;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    isRefetching: boolean;
    error?: unknown;
}

export type UseQueryReducerAction<T = unknown> =
    | { type: UseQueryTypes.LOADING; payload: { isLoading: boolean } }
    | { type: UseQueryTypes.SUCCESS; payload: { data: T } }
    | { type: UseQueryTypes.ERROR; payload: { error: unknown } }
    | { type: UseQueryTypes.REFETCH; payload: { isRefething: true } }
    | { type: UseQueryTypes.RESET; payload: { isLoading: false, isRefetching: false } }
    | { type: UseQueryTypes.SET; payload: { data: T } };

export type UseRunQueryAction = 'init' | 'refetch';
/* useQuery types */