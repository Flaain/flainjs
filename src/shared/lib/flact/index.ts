import { MAX_TASK_RETRIES, THRESHOLD } from "./model/constants";
import { Attributes, FLACT_ERRORS, FLACT_NODE, Fiber, INTERNAL_STATE, PRIORITY_LEVEL, Task, V_NODE } from "./model/types";
import { arrayfy, flat } from "./utils";

export const _INTERNAL_STATE = new Proxy<INTERNAL_STATE>(
    {
        root_fiber: null,
        current_fiber: null,
        scheduler: {
            expires_at: 0,
            channel: typeof MessageChannel !== "undefined" ? new MessageChannel() : null,
            queue: [],
        }
    },
    {
        set: (t, p, v) => {
            if (typeof t[p as keyof INTERNAL_STATE] === "undefined") throw new Error(FLACT_ERRORS.INTERNAL_STATE_ASSIGNMENT_DENIED);

            return Reflect.set(t, p, v);
        },
    }
);

export const createElement = (type: keyof HTMLElementTagNameMap, props?: Attributes, ...children: Array<FLACT_NODE>): V_NODE => {
    props = props || {};
    children = flat(arrayfy(props?.children || children))
  
    if (children.length) props.children = (children.length > 1 ? children : children[0]) as FLACT_NODE
  
    return { type, props }
}

export const render = (vnode: V_NODE, node: HTMLElement) => {
    _INTERNAL_STATE.root_fiber = { node, is_dirty: true, props: { children: vnode } } as Fiber;

    scheduler(createTask(() => console.log('test'), PRIORITY_LEVEL.IMMEDIATE));
};

// clean queue from tasks
export const flush = () => {
    _INTERNAL_STATE.scheduler.expires_at = performance.now() + THRESHOLD;
    
    let t = _INTERNAL_STATE.scheduler.queue[0];

    while (t && !shouldYield()) {
        try {
            const { callback } = t;

            const next = callback();

            next ? (t.callback = next) : _INTERNAL_STATE.scheduler.queue.shift();
        } catch (error) {
            console.log(error);
            t.retries > MAX_TASK_RETRIES ? _INTERNAL_STATE.scheduler.queue.shift() : (t.retries += 1);
        } finally {
            t = _INTERNAL_STATE.scheduler.queue[0];
        }
    }

    t && task()();
}

export const scheduler = (t: Task) => {
    let i = 0;

    while (i < _INTERNAL_STATE.scheduler.queue.length && _INTERNAL_STATE.scheduler.queue[i].priority <= t.priority) {
        if (_INTERNAL_STATE.scheduler.queue[i].priority === t.priority) break;
        
        i++;
    }

    _INTERNAL_STATE.scheduler.queue.splice(i, 0, t);
    
    task(t.priority)();
}

export const createTask = (callback: () => void, priority: PRIORITY_LEVEL): Task => ({ callback, priority, retries: 0, created_at: Date.now() });

export const task = (priority?: PRIORITY_LEVEL) => {
    if (priority === PRIORITY_LEVEL.IMMEDIATE && typeof queueMicrotask !== "undefined") return () => queueMicrotask(flush);

    if (_INTERNAL_STATE.scheduler.channel) {
        const { port1, port2 } = _INTERNAL_STATE.scheduler.channel;

        port1.onmessage = flush;

        return () => port2.postMessage(null);
    }

    return () => setTimeout(flush);
}

export const shouldYield = () => !!_INTERNAL_STATE.scheduler.expires_at && performance.now() >= _INTERNAL_STATE.scheduler.expires_at;