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

const request = async <T> (endpoint: string, options: RequestInit): Promise<ApiResponse<T>> => {
    const url = `${BASE_URL}/${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...options.headers,
        },
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorData = null;

        try {
            errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
        }
        throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {
            data: {} as T,
            status: response.status,
            message: 'Success'
        };
    }

    const data = await response.json();
    return {
        data: data as T,
        status: response.status,
        message: data.message || 'Success'
    };
};

export const get = <T> (endpoint: string, options: RequestInit = {}) =>
    request<T>(endpoint, { ...options, method: 'GET' });

export const post = <T, D> (endpoint: string, body: D, options: RequestInit = {}) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body)
    });
};

export const patch = <T, D> (endpoint: string, body: D, options: RequestInit = {}) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: isFormData ? body : JSON.stringify(body)
    });
};

export const put = <T, D> (endpoint: string, body: D, options: RequestInit = {}) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body)
    });
};

export const del = <T> (endpoint: string, options: RequestInit = {}) =>
    request<T>(endpoint, { ...options, method: 'DELETE' });

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
