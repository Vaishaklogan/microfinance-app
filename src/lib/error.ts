export class ApiError extends Error {
    status: number;
    statusText: string;
    details?: any;

    constructor(message: string, status: number, statusText: string, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
        this.details = details;
    }
}

export async function handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
        let details = {};
        let message = `Request failed: ${response.status} ${response.statusText}`;
        try {
            details = await response.json();
            if (details && typeof details === 'object' && 'error' in details) {
                message = (details as any).error; // Use the backend's error message if available
            }
        } catch (e) {
            // response is not JSON
            try {
                const text = await response.text();
                if (text) details = { raw: text };
            } catch (e2) {
                // ignore
            }
        }
        throw new ApiError(message, response.status, response.statusText, details);
    }
    // For 204 No Content, return null/undefined
    if (response.status === 204) return null;
    return response.json();
}
