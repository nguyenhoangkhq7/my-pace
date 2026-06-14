import {
    normalizeAuthSession,
    useAuthStore,
} from "@/features/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
    public status: number;
    public data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

type RequestOptions = RequestInit & {
    skipAuthRefresh?: boolean;
    skipAuthHeader?: boolean;
};

const isClient = typeof window !== "undefined";

const getAccessToken = () => {
    if (!isClient) {
        return null;
    }

    return useAuthStore.getState().accessToken;
};

const setAuthSession = (payload: unknown) => {
    const session = normalizeAuthSession(payload);

    if (session) {
        useAuthStore.getState().setSession(session);
        return session;
    }

    useAuthStore.getState().clearSession();
    return null;
};

const buildHeaders = (options: RequestOptions) => {
    const isFormData = options.body instanceof FormData;
    const token = options.skipAuthHeader ? null : getAccessToken();

    return {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const parseErrorResponse = async (response: Response) => {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorData = null;

    try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
    } catch {
    }

    return { errorMessage, errorData };
};

const executeRequest = async <T>(endpoint: string, options: RequestOptions): Promise<ApiResponse<T>> => {
    const url = `${BASE_URL}/${endpoint}`;
    const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
        headers: buildHeaders(options),
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        const { errorMessage, errorData } = await parseErrorResponse(response);
        throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {
            data: {} as T,
            status: response.status,
            message: 'Success'
        };
    }

    const json = await response.json();
    const hasWrapper = json && typeof json === "object" && "data" in json && "status" in json;
    const actualData = hasWrapper ? json.data : json;
    const actualStatus = hasWrapper && typeof json.status === "number" ? json.status : response.status;
    const actualMessage = (hasWrapper && typeof json.message === "string") ? json.message : (json.message || "Success");

    return {
        data: actualData as T,
        status: actualStatus,
        message: actualMessage
    };
};

const refreshAccessToken = async () => {
    try {
        const response = await executeRequest<unknown>("auth/refresh", {
            method: "GET",
            skipAuthRefresh: true,
            skipAuthHeader: true,
        });

        return setAuthSession(response.data);
    } catch {
        useAuthStore.getState().clearSession();
        return null;
    }
};

const request = async <T>(endpoint: string, options: RequestOptions): Promise<ApiResponse<T>> => {
    try {
        return await executeRequest<T>(endpoint, options);
    } catch (error) {
        if (
            !(error instanceof ApiError) ||
            error.status !== 401 ||
            options.skipAuthRefresh ||
            endpoint === "auth/refresh"
        ) {
            throw error;
        }

        if (!isClient) {
            throw error;
        }

        const hasToken = Boolean(getAccessToken());

        if (!hasToken) {
            throw error;
        }

        const refreshedSession = await refreshAccessToken();

        if (!refreshedSession) {
            throw error;
        }

        return executeRequest<T>(endpoint, {
            ...options,
            skipAuthRefresh: true,
        });
    }
};

export function get<T>(endpoint: string, options: RequestInit = {}) {
    return request<T>(endpoint, { ...options, method: 'GET' });
}

export function post<T, D>(endpoint: string, body: D, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body)
    });
}

export function patch<T, D>(endpoint: string, body: D, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: isFormData ? body : JSON.stringify(body)
    });
}

export function put<T, D>(endpoint: string, body: D, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body)
    });
}

export function del<T>(endpoint: string, options: RequestInit = {}) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
}

export const fetchClient = {
    get,
    post,
    patch,
    put,
    del,
} as const;

export const getApiErrorMessage = (
    error: unknown,
    fallback = "Cannot connect to the server"
) => {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};
