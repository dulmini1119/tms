export class ApiResponse {
    static success(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            data,
        };
        if (message) {
            response.message = message;
        }
        return res.status(statusCode).json(response);
    }
    static error(res, code, message, statusCode = 500, details, requestId) {
        const response = {
            success: false,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
            },
        };
        if (details) {
            response.error.details = details;
        }
        if (requestId) {
            response.error.requestId = requestId;
        }
        return res.status(statusCode).json(response);
    }
    static created(res, data, message) {
        return this.success(res, data, message, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
}
export default ApiResponse;
//# sourceMappingURL=response.js.map