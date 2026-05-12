const BASE_URL = 'http://localhost:8080/api';

interface ApiResponse<T> {
    data: T,
    status: number
    message: string,
}
const request = async <T> (endpoint: string, options: RequestInit): Promise<ApiResponse<T>> => {
    const url = `${BASE_URL}/${endpoint}`;
    const isFormData = options.body instanceof FormData;
    options = {
        ...options,
        headers: {
            credentials: 'include',
            ...(isFormData ? {} : {"Content-Type": "application/json"}),
            ...options.headers
        }
    }
    const response = await fetch(url, options);
    if(!response.ok) throw new Error(
        `Request failed with status ${response.status}`
    )
    const data = await response.json();
    return {
        data: data as T,
        status: response.status,
        message: data.message || 'Success'
    };
}
export const get = <T> (endpoint: string, options: RequestInit = {}) => request<T>(endpoint, { ...options, method: 'GET' });
export const post = <T, D> (endpoint: string, body: D, options: RequestInit = {}) => request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
export const patch = <T, D> (endpoint: string, body: D, options: RequestInit = {}) => request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
export const put = <T, D> (endpoint: string, body: D, options: RequestInit = {}) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
export const del = (endpoint: string, options: RequestInit = {}) => request(endpoint, { ...options, method: 'DELETE'} );