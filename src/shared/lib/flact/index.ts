import { MAX_TASK_RETRIES, THRESHOLD } from "./model/constants";
import { Action, Attributes, EFFECT_TAG, FLACT_ERRORS, FLACT_NODE, Fiber, INTERNAL_STATE, PRIORITY_LEVEL, Task, V_NODE } from "./model/types";
import { arrayfy, createTask, flat, getKey, isFunction, isPrimitive } from "./utils";

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

export const h = (type: keyof HTMLElementTagNameMap, props?: Attributes | null, ...children: Array<V_NODE>): V_NODE => {
    props = props || {};
    children = flat(arrayfy(props?.children || children));
  
    if (children.length) props.children = (children.length > 1 ? children : children[0]);
  
    return { type, props };
}

export const render = (vnode: V_NODE, node: HTMLElement) => {
    if (!node) throw new Error(FLACT_ERRORS.APP_CONTAINER);

    _INTERNAL_STATE.root_fiber = { type: 'root', node, is_dirty: true, props: { children: vnode } };
console.log(_INTERNAL_STATE.root_fiber)
    // scheduler(createTask(() => reconciliation(_INTERNAL_STATE.root_fiber!), PRIORITY_LEVEL.IMMEDIATE));
};

export const Fragment = ({ children }: Pick<Attributes, 'children'>) => children;

export const flush = () => {
    _INTERNAL_STATE.scheduler.expires_at = performance.now() + THRESHOLD;
    
    let q = _INTERNAL_STATE.scheduler.queue, t = q[0];

    while (t && !shouldYield()) {
        try {
            const { callback } = t, next = callback();

            next ? (t.callback = next) : q.shift();
        } catch (error) {
            console.log(error);
            
            t.retries > MAX_TASK_RETRIES ? q.shift() : (t.retries += 1);
        } finally {
            t = q[0];
        }
    }

    t && scheduleTask()();
}

export const scheduler = (t: Task) => {
    let l = 0, h = _INTERNAL_STATE.scheduler.queue.length, q = _INTERNAL_STATE.scheduler.queue, lt = q[q.length - 1];

    if (!lt || lt.priority <= t.priority) {
        lt?.priority === t.priority ? q.splice(-1, 0, t) : q.push(t);
    } else {
        while (l < h) {
            const m = (l + h) >> 1;
            
            q[m].priority < t.priority ? (l = m + 1) : (h = m);
        }

        q.splice(l, 0, t);
    }
    
    scheduleTask(t.priority)();
}

export const scheduleTask = (priority?: PRIORITY_LEVEL) => {
    if (priority === PRIORITY_LEVEL.IMMEDIATE && typeof queueMicrotask !== "undefined") return () => queueMicrotask(flush);

    if (_INTERNAL_STATE.scheduler.channel) {
        const { port1, port2 } = _INTERNAL_STATE.scheduler.channel;

        port1.onmessage = flush;

        return () => port2.postMessage(null);
    }

    return () => setTimeout(flush);
}

export const shouldYield = () => performance.now() >= _INTERNAL_STATE.scheduler.expires_at;

export const capture = (fiber: Fiber) => {
    (fiber.is_comp = isFunction(fiber.type)) ? updateHook(fiber) : updateHost(fiber);
    
    if (fiber.child) return fiber.child;
    
    return getSibling(fiber);
};

export const getParentNode = (fiber: Fiber) => {
    while (fiber = fiber.parent) {
        if (!fiber.is_comp) return fiber.node;
    }
}
export const reconcileChildren = () => {};
export const clone = (a: any, b: any) => {};
export const removeElement = (fiber: Fiber) => {};

export const diff = (old_ch: any, new_ch: any) => {
    const actions: Array<Action> = [], old_map: Record<string, any> = {}, new_map: Record<string, any> = {}, old_l = old_ch.length, new_l = new_ch.length;
    
    let i = 0, j = 0;

    for (let i = 0; i < old_l; i += 1) old_map[getKey(old_ch[i])] = i;
    for (let i = 0; i < new_l; i += 1) new_map[getKey(new_ch[i])] = i;

    while (i < old_l || j < new_l) {
        const old_elm = old_ch[i], new_elm = new_ch[j], new_elm_in_old = old_map[getKey(new_elm)], has_old = typeof new_map[getKey(old_elm)] !== "undefined";

        if (old_elm === null) {
            i += 1;
        } else if (j >= new_ch.length || i >= old_ch.length) {
            j >= new_ch.length ? (removeElement(old_elm), (i += 1)) : (actions.push({ type: EFFECT_TAG.INSERT, element: new_elm }), (j += 1));
        } else if (getKey(old_elm) === getKey(new_elm)) {
            clone(old_elm, new_elm);

            actions.push({ type: EFFECT_TAG.UPDATE });

            i += 1;
            j += 1;
        } else if (!has_old || typeof new_elm_in_old === 'undefined') {
            !has_old ? (removeElement(old_elm), i += 1) : (actions.push({ type: EFFECT_TAG.INSERT, element: new_elm, before: old_elm }), j += 1);
        } else {
            clone(old_ch[new_elm_in_old], new_elm);

            actions.push({ type: EFFECT_TAG.MOVE, element: new_elm, before: old_elm });

            old_ch[new_elm_in_old] = null;

            j += 1;
        }
    } // old_ch = [A, E, C, B = null, D], new_ch = [B, A, C];

    return actions;
}

export const updateElement = (node: any, props?: Attributes, old_props?: Attributes) => {
    for (const k of new Set([...Object.keys(old_props ?? {}), ...Object.keys(props ?? {})])) {
        const old_value = old_props?.[k], new_value = props?.[k];

        if (old_value === new_value || k === "children") continue;

        if (k === "style") {
            for (const s of Object.keys(old_value)) {
                const v = new_value[s];

                old_value[s] !== v && (node[k][s] = v ?? "");
            }

            for (const s of Object.keys(new_value)) !(s in old_value) && (node[k][s] = new_value[s]);
        } else if (k.startsWith("on")) {
            const event_name = k.slice(2).toLowerCase();

            old_value && node.removeEventListener(event_name, old_value);

            isFunction(new_value) && node.addEventListener(event_name, new_value);
        } else if (k in node && !(node instanceof SVGElement)) node[k] = new_value ?? "";
        else new_value ? node.setAttribute(k, new_value) : node.removeAttribute(k);
    }
};

export const createElement = (fiber: Fiber) => {
    const node = fiber.type === "#text" ? document.createTextNode("") : fiber.lane! & EFFECT_TAG.SVG ? document.createElementNS("http://www.w3.org/2000/svg", fiber.type as string) : document.createElement(fiber.type as string); 

    updateElement(node, fiber.props);

    return node;
}

export const createHostNode = (fiber: Fiber) => {
    fiber.type === 'svg' && (fiber.lane! |= EFFECT_TAG.SVG);
    
    return createElement(fiber);
}

export const getSibling = (fiber: Fiber) => {};

export const updateHook = (fiber: Fiber) => {};

export const updateHost = (fiber: Fiber) => {
    fiber.parent_node = isFunction(fiber.parent?.type) ? getParentNode(fiber.parent!) : fiber.parent?.node;
    fiber.node ??= createHostNode(fiber);
};

export const reconciliation = (fiber: Fiber) => {
    while (fiber && !shouldYield()) fiber = capture(fiber);

    return fiber ? () => reconciliation(fiber) : null;
}