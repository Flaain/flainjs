import { EMPTY_DEPS, MAX_TASK_RETRIES, THRESHOLD, queryActions } from "./model/constants";
import { arrayfy, createTask, deepEqual, errorAction, flat, getKey, handleFCreturn, isDepsChanged, isFunction, isPrimitive, queryReducer } from "./utils";
import {
    Attributes,
    DependencyList,
    Dispatch,
    EFFECT_TAG,
    EffectCallback,
    EffectType,
    FLACT_ERRORS,
    Fiber,
    INTERNAL_STATE,
    Initializer,
    PRIORITY_LEVEL,
    Reducer,
    RefObject,
    SetStateAction,
    Task,
    UseQueryCallback,
    UseQueryConfig,
    UseQueryOptions,
    UseQueryReducerAction,
    UseQueryReducerState,
    UseQueryReturn,
    UseQueryTypes,
    UseRunQueryAction,
    VNode,
    VNodeType,
} from "./model/types";

const _INTERNAL_STATE: INTERNAL_STATE = {
    root_fiber: null,
    current_fiber: null,
    scheduler: {
        expires_at: 0,
        channel: typeof MessageChannel !== "undefined" ? new MessageChannel() : null,
        queue: [],
    },
};

const h = (type: VNodeType, props?: Attributes | null, ...children: Array<VNode>): VNode => {
    props = props || {};
    children = flat(arrayfy(props.children || children));

    const key = props.key || null, ref = props.ref ?? null, isFunc = isFunction(type);

    key && (props.key = undefined);

    !isFunc && ref && (props.ref = undefined);

    children.length && (props.children = (children.length > 1 ? children : children[0]));

    return { type, key, ref: isFunc ? null : ref, props };
}

const render = (vnode: VNode, node: HTMLElement) => {
    if (!node) throw new Error(FLACT_ERRORS.APP_CONTAINER);

    _INTERNAL_STATE.root_fiber = { type: 'root', node, is_dirty: true, props: { children: vnode } };

    console.log(_INTERNAL_STATE.root_fiber);

    scheduler(createTask(() => reconciliation(_INTERNAL_STATE.root_fiber!), PRIORITY_LEVEL.IMMEDIATE));
};

const Fragment = ({ children }: Pick<Attributes, 'children'>) => children;

const flush = () => {
    _INTERNAL_STATE.scheduler.expires_at = performance.now() + THRESHOLD;
    
    let q = _INTERNAL_STATE.scheduler.queue, t = q[0];

    while (t && !shouldYield()) {
        try {
            const { callback } = t, next = callback();

            next ? (t.callback = next) : q.shift();
        } catch (error) {
            console.error(error);
            
            t.retries === MAX_TASK_RETRIES ? q.shift() : (t.retries += 1);
        } finally {
            t = q[0];
        }
    }

    t && scheduleTask()();
}

const scheduler = (t: Task) => {
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

const scheduleTask = (priority?: PRIORITY_LEVEL) => {
    if (priority === PRIORITY_LEVEL.IMMEDIATE && typeof queueMicrotask !== "undefined") return () => queueMicrotask(flush);

    if (_INTERNAL_STATE.scheduler.channel) {
        const { port1, port2 } = _INTERNAL_STATE.scheduler.channel;

        port1.onmessage = flush;

        return () => port2.postMessage(null);
    }

    return () => setTimeout(flush);
}

const shouldYield = () => performance.now() >= _INTERNAL_STATE.scheduler.expires_at;

const getParentNode = (fiber?: Fiber) => {
    while (fiber = fiber?.parent) if (!fiber.is_comp) return fiber.node;
}

const reconcileChildren = (fiber: Fiber) => {
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

const clone = (a: Fiber, b: Fiber) => {
    b.hooks = a.hooks;
    b.ref = a.ref;
    b.node = a.node;
    b.children = a.children;
    b.alternate = a;
};

const removeElement = (fiber: Fiber) => {
    if (fiber.is_comp) {
        fiber.hooks?.list.forEach((h) => h[2]?.());
        fiber.children.forEach(removeElement);
    } else {
        fiber.parent_node?.removeChild(fiber.node);
    }
};

const diff = (old_ch: Array<Fiber | null>, new_ch: Array<Fiber>) => {
    const old_map: Record<string, Array<number> | null> = {}, new_map: Record<string, number> = {}, old_l = old_ch.length, new_l = new_ch.length;

    let i = 0, j = 0;

    for (let i = 0; i < old_ch.length; i += 1) {
        const key = getKey(old_ch[i]!);

        old_map[key] ? old_map[key]!.push(i) : (old_map[key] = [i]);
    }

    for (let i = 0; i < new_l; i += 1) new_map[getKey(new_ch[i])] = i;

    while (i < old_l || j < new_l) {
        const old_elm = old_ch[i], new_elm = new_ch[j], old_arr = old_map[getKey(new_elm)], has_old = typeof new_map?.[getKey(old_elm!)] !== "undefined";

        if (old_elm === null) {
            i += 1;
        } else if (j >= new_l || i >= old_l) {
            j >= new_l ? ((old_elm.action = { type: EFFECT_TAG.REMOVE }), (i += 1)) : ((new_elm.action = { type: EFFECT_TAG.INSERT }), (j += 1));
        } else if (getKey(old_elm) === getKey(new_elm)) {
            const key = getKey(old_elm);

            clone(old_elm, new_elm);
            
            new_elm.action = { type: EFFECT_TAG.UPDATE };

            old_map[key]?.shift();
            
            !old_map[key]?.length && (old_map[key] = null);

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
            const key = getKey(new_elm);

            clone(old_ch[old_arr![0]]!, new_elm);

            old_elm.related_with = new_elm;

            new_elm.action = { type: EFFECT_TAG.MOVE, before: old_elm };

            old_ch[old_arr![0]] = null;

            old_map[key]?.shift();

            !old_map[key]?.length && (old_map[key] = null);

            j += 1;
        }
    }
};

const updateElement = (node: SVGElement | Text | HTMLElement, props: Attributes = {}, old_props: Attributes = {}) => {
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
        else !(node instanceof Text) && (new_value ? node.setAttribute(k, new_value) : node.removeAttribute(k));
    }
};

const createElement = (fiber: Fiber) => {
    const node = fiber.type === "text" ? document.createTextNode("") : fiber.lane! & EFFECT_TAG.SVG ? document.createElementNS("http://www.w3.org/2000/svg", fiber.type as string) : document.createElement(fiber.type as string); 

    updateElement(node, fiber.props);

    return node;
}

const createHostNode = (fiber: Fiber) => {
    fiber.type === 'svg' && (fiber.lane! |= EFFECT_TAG.SVG);
    
    return createElement(fiber);
}

const propagateEffects = (fiber: Fiber | undefined) => {
    if (!fiber?.child) return;

    const isParentShouldMoved = fiber.action?.type! & EFFECT_TAG.MOVE;

    fiber.child.action!.type |= fiber.action?.type!;
    
    isParentShouldMoved && (fiber.child.action!.before = fiber.action?.before);

    if (fiber.child.sibling) {
        let sibling: Fiber | undefined = fiber.child.sibling;
                
        while (sibling) {
            sibling.action!.type |= fiber.action?.type!;

            isParentShouldMoved && (sibling.action!.before = fiber.action?.before);
            
            sibling = sibling.sibling;
        }
    }
}

const applyEffects = (fiber: Fiber) => {
    if (fiber.action?.type! & EFFECT_TAG.MOVE || fiber.action?.type! & EFFECT_TAG.INSERT) {
        if (isFunction(fiber.action?.before?.type)) while (fiber.action!.before = (fiber.action!.before?.child ?? fiber.action!.before?.sibling)) if (!fiber.action!.before?.is_comp) break;

        fiber.parent_node?.insertBefore(fiber.node, fiber.action?.before?.node);
    }

    if (fiber.action?.type! & EFFECT_TAG.MOVE || fiber.action?.type! & EFFECT_TAG.UPDATE) {
        updateElement(fiber.node, fiber.props, fiber.alternate?.props);
    }

    if (fiber.action?.before?.action?.type! & EFFECT_TAG.REMOVE && fiber.action?.before?.related_with === fiber) {
        removeElement(fiber.action.before);
    }

    fiber.ref && (isFunction(fiber.ref) ? fiber.ref(fiber.node) : (fiber.ref.current = fiber.node));
};

const commit = (fiber?: Fiber) => {
    if (!fiber) return;

    typeof fiber.action?.type !== "undefined" && (fiber.is_comp ? propagateEffects(fiber) : applyEffects(fiber));

    fiber.action = null;

    commit(fiber.child);
    commit(fiber.sibling);
}

const getSibling = (fiber?: Fiber) => {
    while (fiber) {
        if (fiber.is_comp && (fiber.hooks?.effect || fiber.hooks?.layout)) {
            const e = fiber.hooks.effect;

            fiber.hooks.layout.length && runEffect(fiber.hooks.layout);
            e.length && scheduler(createTask(() => runEffect(e)));
        }

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

const runEffect = (effects: Array<any>) => {
    for (const e of effects) e[2]?.();
    for (const e of effects) e[2] = e[0]!();

    effects.length = 0;
}

const updateFiber = (fiber: Fiber) => {
    if (!fiber.is_dirty) {
        fiber.is_dirty = true;
        scheduler(createTask(() => reconciliation(fiber)));
    }
}

const reconciliation = (fiber: Fiber | null) => {
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

const getHook = (): readonly [Array<any>, Fiber] => {
    const hooks = _INTERNAL_STATE.current_fiber?.hooks || (_INTERNAL_STATE.current_fiber!.hooks = { cursor: 0, list: [], effect: [], layout: [] });

    hooks.cursor >= hooks.list.length && hooks.list.push([]);

    return [hooks.list[hooks.cursor++], _INTERNAL_STATE.current_fiber!];
}

const useState = <T>(initialState: T | Initializer<T>) => useReducer<T, SetStateAction<T>>(null!, initialState);

const useReducer = <S, A>(reducer: Reducer<S, A>, initialState: S | Initializer<S>): readonly [S, Dispatch<A>] => {
    const { 0: hook, 1: current } = getHook();

    if (!hook.length) {
        hook[0] = isFunction(initialState) ? initialState() : initialState;
        hook[1] = (v: A) => {
            const data = reducer ? reducer(hook[0], v) : isFunction(v) ? v(hook[0]) : v;
            
            hook[0] !== data && ((hook[0] = data), updateFiber(current));
        };
    }

    return hook as [S, Dispatch<A>];
};

const useMemo = <T>(сb: () => T, deps: DependencyList): T => {
    const { 0: hook } = getHook();

    if (isDepsChanged(hook[1], deps)) {
        hook[0] = сb();
        hook[1] = deps;
    }

    return hook[0];
}

const useRef = <T>(s: T): RefObject<T> => useMemo(() => {
    const p = new Proxy<RefObject<T>>({ current: s }, {
        set: (t, p, v) => {
            if (p !== 'current') throw new Error(FLACT_ERRORS.REF_STATE_ASSIGNMENT_DENIED);

            return Reflect.set(t, p, v);
        },
    });

    return p;
}, EMPTY_DEPS);

const useCallback = <T extends (...args: Array<any>) => any>(сb: T, deps: DependencyList) => useMemo<T>(() => сb, deps);

const useEffect = (cb: EffectCallback, deps?: DependencyList) => effectImpl(cb, deps!, 'effect');

const useLayoutEffect = (cb: EffectCallback, deps?: DependencyList) => effectImpl(cb, deps!, 'layout');

const effectImpl = (cb: EffectCallback, deps: DependencyList, type: EffectType) => {
    const { 0: hook, 1: current } = getHook();
    
    if (isDepsChanged(hook[1], deps)) {
        hook[0] = cb;
        hook[1] = deps;

        current.hooks![type].push(hook);
    }
};

const useQuery = <T>(callback: UseQueryCallback<T>, options?: Partial<UseQueryOptions<T>>): UseQueryReturn<T> => {
    const { 0: state, 1: dispatch } = useReducer<UseQueryReducerState<T>, UseQueryReducerAction<T>>(queryReducer, {
        isError: false,
        isLoading: options?.enabled ?? true,
        isSuccess: false,
        isRefetching: false,
        data: undefined,
        error: undefined
    });
    
    const config = useRef<UseQueryConfig>({
        abortController: new AbortController(),
        currentAction: null,
        mounted: false, 
        requested: false,
        retry: Number(options?.retry) || 0, 
        interval: null, 
        timeout: null 
    });

    const abort = useCallback(() => {
        config.current.abortController.abort();
        config.current.abortController = new AbortController();
    }, EMPTY_DEPS)

    const setData = useCallback((setter: SetStateAction<Partial<T>>) => {
        if (!state.data) throw new Error(`${FLACT_ERRORS.USE_QUERY_SETTER}.\nCurrent data is: ${JSON.stringify(state.data)}`);

        dispatch({ type: UseQueryTypes.SET, payload: { data: { ...state.data, ...(isFunction(setter) ? setter(state.data) : setter) } } });
    }, [state]);

    const runQuery = useCallback(async (action: UseRunQueryAction) => {
        if (!callback) throw new Error(FLACT_ERRORS.USE_QUERY_NO_CALLBACK);
        
        try {
            abort();

            config.current.currentAction !== action && (dispatch(queryActions[action]), (config.current.currentAction = action));

            const data = await callback({ signal: config.current.abortController.signal });

            dispatch({ type: UseQueryTypes.SUCCESS, payload: { data: options?.onSelect?.(data) ?? data } });

            options?.onSuccess?.(data);

            config.current.currentAction = null;

            options?.refetchInterval && (config.current.interval = setInterval(runQuery, options.refetchInterval, 'refetch'));
        } catch (error) {
            if (error instanceof Error) {
                if (config.current.retry > 0) {
                    config.current.retry -= 1;
                    
                    const timeout = setTimeout(() => {
                        runQuery(action);
                        clearTimeout(timeout);
                    }, options?.retryDelay ?? 1000);
                    
                    config.current.timeout = timeout;
                } else {
                    dispatch(errorAction(error));

                    config.current.currentAction = null;
                }
                
                options?.onError?.(error);
            }
        }
    }, [callback]);

    useEffect(() => {
        config.current.mounted = true;

        (options?.enabled ?? true) && runQuery('init');

        return () => {
            abort();

            config.current.interval && clearInterval(config.current.interval);
            config.current.timeout && clearTimeout(config.current.timeout);
        };
    }, options?.keys ?? EMPTY_DEPS);

    return { ...state, setData, abort, call: () => runQuery('init'), refetch: () => runQuery('refetch') }
};

const useMutableState = <T extends Record<string | number, any>>(initialState: T) => {
    if (!initialState || typeof initialState !== "object" || Array.isArray(initialState)) throw new Error(FLACT_ERRORS.USE_MUTABLE_STATE_NOT_OBJECT);

    const { 0: hook, 1: current } = getHook();

    const createDeepProxy = useCallback((t: any) => {
        if (typeof t !== "object" || t === null) return t;

        return new Proxy<any>(t, {
            get: (t, p) => createDeepProxy(t[p]),
            set: (t, p, v) => {
                if (Array.isArray(t)) {
                    const item = t[p];

                    if (p === "length") {
                        item !== v && updateFiber(current);
                    } else if (typeof item !== "undefined") {
                        !deepEqual(item, v) && updateFiber(current);
                    } else {
                        updateFiber(current);
                    }
                } else {
                    !deepEqual(t[p], v) && updateFiber(current);
                }

                return Reflect.set(t, p, v);
            },
        });
    }, []);

    !hook.length && (hook[0] = createDeepProxy(initialState));

    return hook[0];
}

export const Fla = {
    h,
    render,
    useState,
    useMutableState,
    useEffect,
    useLayoutEffect,
    useReducer,
    useMemo,
    useCallback,
    useRef,
    useQuery,
    Fragment
}