import { Response } from 'express';

export interface ApiSuccessPayload<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  data?: null;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Operação realizada com sucesso',
  statusCode = 200,
): void => {
  const payload: ApiSuccessPayload<T> = { success: true, message, data };
  res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
): void => {
  const payload: ApiErrorPayload = { success: false, message, data: null };
  res.status(statusCode).json(payload);
};
