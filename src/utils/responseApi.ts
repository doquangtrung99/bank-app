import { Response } from 'express';

export class ResponseAPI<T> {
    static async success<T>(res: Response, data: T, statusCode: number) {
        return res.status(statusCode).json({
            status: statusCode,
            data
        });
    }
}