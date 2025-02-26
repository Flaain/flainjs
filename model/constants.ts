import { UseQueryReducerAction, UseQueryTypes, UseRunQueryAction } from "./types";

export const THRESHOLD = 5;
export const MAX_TASK_RETRIES = 3;
export const queryActions: Record<UseRunQueryAction, UseQueryReducerAction<any>> = {
    init: { type: UseQueryTypes.LOADING, payload: { isLoading: true } },
    refetch: { type: UseQueryTypes.REFETCH, payload: { isRefething: true } },
};