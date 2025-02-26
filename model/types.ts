export type ROOT_FIBER = Pick<Fiber, 'props' | 'child' | 'children' | 'is_dirty' | 'is_comp' | 'node'> & { type: Extract<V_NODE_TYPE, 'root'> }; 
export type V_NODE_TYPE = keyof HTMLElementTagNameMap | "text" | "root" | "svg" | FC;
export type EFFECT_TYPE = 'effect' | 'layout';
export type FLA_NODE = V_NODE | Array<V_NODE> | string | number | boolean | null | undefined;
export type REF = ((node: HTMLElement | null) => void) | { current: HTMLElement | null };
export type Effect = [Function?, number?, Function?];

export enum FLACT_ERRORS {
    REF_STATE_ASSIGNMENT_DENIED = "Property assignment denied: Cannot define a non-existent property in REF\nAllowed properties: current",
    APP_CONTAINER = "App container is missing"
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

export interface RefObj<T> { current: T };

export interface FC<P extends Attributes = {}> {
    (props: P): V_NODE<P> | null;
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
    children?: FLA_NODE;
    ref?: REF | null;
    key?: string | null;
}

export interface V_NODE<P extends Attributes = any, T = V_NODE_TYPE> {
    type: T;
    props?: P;
    ref?: REF | null;
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
    list: Array<Effect>;
    layout: Array<Effect>;
    effect: Array<Effect>;
}


export interface Fiber<P extends Attributes = any> {
    key?: null | string;
    type: V_NODE_TYPE;
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
    ref?: REF;
    hooks?: Hook;
    action?: Action | null;
    props?: P;
    lane?: number;
    is_comp?: boolean;
}

export interface INTERNAL_STATE {
    root_fiber: ROOT_FIBER | null;
    current_fiber: Fiber | null;
    scheduler: {
        queue: Array<Task>;
        channel: MessageChannel | null;
        expires_at: number;
    };
}
