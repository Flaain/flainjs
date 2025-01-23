export type V_NODE_TYPE = keyof HTMLElementTagNameMap | '#text';

export enum PRIORITY_LEVEL {
    NO = 0,
    IMMEDIATE = 1,
    USER_BLOCK = 1 << 1,
    NORMAL = 1 << 2,
    LOW = 1 << 3,
    IDLE = 1 << 4
}

export enum EFFECT_TAG {
    PLACEMENT = 0,
    UPDATE = 1,
    DELETION = 1 << 1
}

export type WithLastElement = HTMLElement & { last?: Fiber | null }
export type FLACT_NODE = V_NODE | Array<V_NODE> | string | number | boolean | null | undefined;

export interface Attributes extends Record<string, any> {
    key?: null | string;
    children?: FLACT_NODE;
    // ref?: Ref;
}

export interface V_NODE<P extends Attributes = any, T = V_NODE_TYPE> {
    type: T;
    props?: P;
    key?: null | string;
}

export interface Task {
    callback: () => any;
    retries: number;
    priority: PRIORITY_LEVEL;
    created_at: number;
}

export interface Fiber<P extends Attributes = any> {
    key?: null | string;
    type: V_NODE_TYPE;
    node: WithLastElement;
    kids?: any;
    is_dirty: boolean;
    effect_tag: EFFECT_TAG;
    parent?: Fiber<P>;
    sibling?: Fiber<P>;
    child?: Fiber<P>;
    done?: () => void;
    // ref: ;
    // hooks: ;
    old_props: P;
    action: any;
    props: P;
    lane: number;
    is_comp: boolean;
}

export enum FLACT_ERRORS {
    INTERNAL_STATE_ASSIGNMENT_DENIED = "Property assignment denied: Cannot define a non-existent property in INTERNAL_STATE\nAllowed properties: root_fiber, current_fiber",
}

export interface INTERNAL_STATE {
    root_fiber: Fiber | null;
    current_fiber: Fiber | null;
    scheduler: {
        queue: Array<Task>;
        channel: MessageChannel | null;
        expires_at: number;
    }
}
