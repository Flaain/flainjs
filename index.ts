import { MAX_TASK_RETRIES, THRESHOLD } from "./model/constants";
import { Action, Attributes, EFFECT_TAG, FLACT_ERRORS, FLACT_NODE, Fiber, INTERNAL_STATE, PRIORITY_LEVEL, Task, V_NODE } from "./model/types";
import { arrayfy, createTask, flat, getKey, handleFCreturn, isFunction, isPrimitive } from "./utils";

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
    children = flat(arrayfy(props.children || children));

    const key = props.key ?? null;

    props.key && (props.key = undefined);
    children.length && (props.children = (children.length > 1 ? children : children[0]));

    return { type, key, props };
}

export const render = (vnode: V_NODE, node: HTMLElement) => {
    if (!node) throw new Error(FLACT_ERRORS.APP_CONTAINER);

    _INTERNAL_STATE.root_fiber = { type: 'root', node, is_dirty: true, props: { children: vnode } };
    console.log(_INTERNAL_STATE)
    scheduler(createTask(() => reconciliation(_INTERNAL_STATE.root_fiber!), PRIORITY_LEVEL.IMMEDIATE));
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
            console.error(error);
            
            t.retries > MAX_TASK_RETRIES ? q.shift() : (t.retries += 1);
        } finally {
            t = q[0];
        }
    }

    t && scheduleTask()();
}

export const scheduler = (t: Task) => {
    let l = 0, h = _INTERNAL_STATE.scheduler.queue.length, q = _INTERNAL_STATE.scheduler.queue, lt = q[q.length - 1];

    if (!lt || typeof t.priority === "undefined") {
        q.push(t);
        scheduleTask(t.priority)();

        return;
    }

    while (l < h) {
        const m = (l + h) >> 1;
        
        q[m].priority ? (q[m].priority! < t.priority ? (l = m + 1) : (h = m)) : (h = m);
    }

    q.splice(l, 0, t);

    scheduleTask(t.priority)();
};

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

export const getParentNode = (fiber?: Fiber) => {
    while (fiber = fiber?.parent) if (!fiber.is_comp) return fiber.node;
}

export const reconcileChildren = (fiber: Fiber) => {
    const old_ch = fiber.children ?? [], new_ch = (fiber.children = arrayfy(fiber.is_comp ? handleFCreturn((fiber as any).type(fiber.props)) : fiber.props.children));

    diff(old_ch, new_ch);

    for (let i = 0, prev: Fiber = null!; i < new_ch.length; i += 1) {
        const child = new_ch[i];

        fiber.lane! & EFFECT_TAG.SVG && (child.lane |= EFFECT_TAG.SVG);

        child.parent = fiber;

        i ? (prev.sibling = child) : (fiber.child = child);

        prev = child;
    }

    for (let i = 0; i < old_ch.length; i += 1) {
        const elm = old_ch[i];

        elm?.action?.type! & EFFECT_TAG.REMOVE && !elm?.related_with && removeElement(elm!);
    }
};

export const clone = (a: any, b: any) => {
    b.hooks = a.hooks;
    b.ref = a.ref;
    b.node = a.node;
    b.children = a.children;
    b.alternate = a;
};

export const removeElement = (fiber: Fiber) => {
    if (fiber.is_comp) {
        fiber.children.forEach(removeElement);
    } else {
        fiber.parent_node?.removeChild(fiber.node);
    }
};

export const diff = (old_ch: Array<Fiber | null>, new_ch: Array<Fiber>) => {
    const old_map: Record<string, Array<number> | null> = {}, new_map: Record<string, any> = {}, old_l = old_ch.length, new_l = new_ch.length;

    let i = 0, j = 0;

    for (let i = 0; i < old_ch.length; i += 1) old_map[getKey(old_ch[i])] ? old_map[getKey(old_ch[i])]!.push(i) : (old_map[getKey(old_ch[i])] = [i]);

    for (let i = 0; i < new_l; i += 1) new_map[getKey(new_ch[i])] = i;

    while (i < old_l || j < new_l) {
        const old_elm = old_ch[i], new_elm = new_ch[j], old_arr = old_map[getKey(new_elm)], has_old = typeof new_map?.[getKey(old_elm)] !== "undefined";

        if (old_elm === null) {
            i += 1;
        } else if (j >= new_l || i >= old_l) {
            j >= new_l ? ((old_elm.action = { type: EFFECT_TAG.REMOVE }), (i += 1)) : ((new_elm.action = { type: EFFECT_TAG.INSERT }), (j += 1));
        } else if (getKey(old_elm) === getKey(new_elm)) {
            clone(old_elm, new_elm);

            new_elm.action = { type: EFFECT_TAG.UPDATE };

            old_map[getKey(old_elm)]?.shift();

            !old_map[getKey(old_elm)]?.length && (old_map[getKey(old_elm)] = null);

            i += 1;
            j += 1;
        } else if (!has_old) {
            old_elm.action = { type: EFFECT_TAG.REMOVE };

            i += 1;
        } else if (!old_arr) {
            old_elm.related_with = new_elm;
            new_elm.action = { type: EFFECT_TAG.INSERT, before: old_elm };

            j += 1;
        } else {
            clone(old_ch[old_arr![0]], new_elm);

            old_elm.related_with = new_elm;

            new_elm.action = { type: EFFECT_TAG.MOVE, before: old_elm };

            old_ch[old_arr![0]] = null;

            old_map[getKey(new_elm)]?.shift();

            !old_map[getKey(new_elm)]?.length && (old_map[getKey(new_elm)] = null);

            j += 1;
        }
    }
};

export const updateElement = (node: any, props: Attributes = {}, old_props: Attributes = {}) => {
    for (const k of new Set([...Object.keys(old_props), ...Object.keys(props)])) {
        const old_value = old_props?.[k], new_value = props?.[k];

        if (old_value === new_value || k === "children") continue;

        if (k === "style") {
            for (const s of Object.keys(old_value ?? {})) {
                const v = new_value?.[s];

                old_value[s] !== v && (node[k][s] = v ?? "");
            }

            for (const s of Object.keys(new_value ?? {})) !(s in (old_value ?? {})) && (node[k][s] = new_value[s]);
        } else if (k.startsWith("on")) {
            const e = k.slice(2).toLowerCase();

            node.removeEventListener(e, old_value);

            isFunction(new_value) && node.addEventListener(e, new_value);
        } else if (k in node && !(node instanceof SVGElement)) node[k] = new_value ?? "";
        else new_value ? node.setAttribute(k, new_value) : node.removeAttribute(k);
    }
};

export const createElement = (fiber: Fiber) => {
    const node = fiber.type === "text" ? document.createTextNode("") : fiber.lane! & EFFECT_TAG.SVG ? document.createElementNS("http://www.w3.org/2000/svg", fiber.type as string) : document.createElement(fiber.type as string); 

    updateElement(node, fiber.props);

    return node;
}

export const createHostNode = (fiber: Fiber) => {
    fiber.type === 'svg' && (fiber.lane! |= EFFECT_TAG.SVG);
    
    return createElement(fiber);
}

export const propagateEffects = (fiber: Fiber | undefined) => {
    if (!fiber?.child) return;

    fiber.child.action!.type |= fiber.action?.type!;

    if (fiber.child.sibling) {
        let sibling: Fiber | undefined = fiber.child.sibling;
                
        while (sibling) {
            sibling.action!.type |= fiber.action?.type!;
            sibling = sibling.sibling;
        }
    }
}

export const applyEffects = (fiber: Fiber) => {
    if (fiber.action?.type! & EFFECT_TAG.MOVE || fiber.action?.type! & EFFECT_TAG.INSERT) {
        fiber.parent_node?.insertBefore(fiber.node, fiber.action?.before?.node);
    }

    if (fiber.action?.type! & EFFECT_TAG.MOVE || fiber.action?.type! & EFFECT_TAG.UPDATE) {
        updateElement(fiber.node, fiber.props, fiber.alternate?.props);
    }

    if (fiber.action?.before?.action?.type! & EFFECT_TAG.REMOVE && fiber.action?.before?.related_with === fiber) {
        removeElement(fiber.action.before);
    }
};

export const commit = (fiber?: Fiber) => {
    if (!fiber) return;

    typeof fiber.action?.type !== "undefined" && (fiber.is_comp ? propagateEffects(fiber) : applyEffects(fiber));

    fiber.action = null;

    commit(fiber.child);
    commit(fiber.sibling);
}

export const getSibling = (fiber?: Fiber) => {
    while (fiber) {
        // buble(fiber);
        if (fiber.is_dirty) {
            fiber.is_dirty = false;
            
            commit(fiber);
            
            return null;
        }

        if (fiber.sibling) return fiber.sibling;

        fiber = fiber.parent;
    }

    return null;
};

export const getHook = () => {
    const current_fiber = _INTERNAL_STATE.current_fiber;
    const hooks = current_fiber?.hooks || (current_fiber!.hooks = { cursor: 0, list: [], effect: [], layout: [] });

    hooks.cursor >= hooks.list.length && hooks.list.push([]);

    return [hooks.list[hooks.cursor++], current_fiber];
}

export const useState = (initialState: any) => useReducer(null, isFunction(initialState) ? initialState() : initialState);

export const useReducer = (reducer: any = null, initialState: any) => {
    const [hook, current]: any = getHook();

    if (!hook.length) {
        hook[0] = initialState;
        hook[1] = (v: any) => {
            const data = reducer ? reducer(hook[0], v) : isFunction(v) ? v(hook[0]) : v;

            if (hook[0] !== data) {
                hook[0] = data;

                if (!current.is_dirty) {
                    current.is_dirty = true;
                    scheduler(createTask(() => reconciliation(current)));
                }
            }
        };
    }

    return hook;
};

export const reconciliation = (fiber: Fiber | null) => {
    while (fiber && !shouldYield()) {
        if ((fiber.is_comp = isFunction(fiber.type))) {
            _INTERNAL_STATE.current_fiber = fiber;
        } else {
            fiber.type !== "root" && (fiber.parent_node = isFunction(fiber.parent?.type) ? getParentNode(fiber.parent!) : fiber.parent?.node);
            fiber.node ??= createHostNode(fiber);
        }

        reconcileChildren(fiber!);

        fiber.hooks && (fiber.hooks.cursor = 0);

        fiber = fiber.child ?? getSibling(fiber);
    }

    return fiber ? () => reconciliation(fiber) : null;
};