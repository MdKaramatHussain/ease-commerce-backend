import axios, { AxiosError, AxiosInstance } from "axios";
import { config } from "../config";
import { loggerService } from "../services/logger.service";
import { CourierTimeoutError, CourierApiError } from "../utils/errors";
import { retryWithBackoff } from "../utils/retry";

export class BaseCourierClient {
  protected axiosInstance: AxiosInstance;
  protected authToken: string | null = null;

  constructor(protected courierName: string) {
    this.axiosInstance = axios.create({
      timeout: config.courier.timeout,
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  protected async request<T>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      const response = await retryWithBackoff(
        async () => {
          return await this.axiosInstance[method](url, data, {
            headers: this.getHeaders(headers),
          });
        },
        config.courier.maxRetries,
        config.courier.retryDelay
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  protected getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return { ...headers, ...customHeaders };
  }

  private handleError(error: any): never {
    if (error.code === "ECONNABORTED") {
      loggerService.error(
        `${this.courierName} request timeout`,
        error,
        { courier: this.courierName }
      );
      throw new CourierTimeoutError(this.courierName, config.courier.timeout);
    }

    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const message =
        (axiosError.response.data as any)?.message ||
        axiosError.message;

      loggerService.error(
        `${this.courierName} API error`,
        error,
        { courier: this.courierName, status }
      );

      throw new CourierApiError(
        this.courierName,
        message,
        status,
        axiosError.response.data as Record<string, any>
      );
    }

    loggerService.error(
      `${this.courierName} unexpected error`,
      error,
      { courier: this.courierName }
    );

    throw new CourierApiError(this.courierName, error.message || "Unknown error", 500);
  }
}
