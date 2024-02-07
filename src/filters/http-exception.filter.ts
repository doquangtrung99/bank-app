import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const convertData = JSON.parse(JSON.stringify(exception.getResponse())).message
        const message = convertData ? (Array.isArray(convertData) ? convertData[0] : convertData) : null;
        response
            .status(status)
            .json({
                statusCode: status || 500,
                message: message || exception.message || 'Internal server error',
            });
    }
}