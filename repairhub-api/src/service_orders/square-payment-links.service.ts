import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SquarePaymentLinkResult {
  id: string;
  orderId: string;
  url: string;
}

@Injectable()
export class SquarePaymentLinksService {
  constructor(private readonly config: ConfigService) {}

  async createPaymentLink(input: {
    title: string;
    amount: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<SquarePaymentLinkResult> {
    const locationId = this.requiredConfig('SQUARE_LOCATION_ID');
    const response = await this.request('/v2/online-checkout/payment-links', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: input.idempotencyKey,
        quick_pay: {
          name: input.title,
          price_money: {
            amount: input.amount,
            currency: input.currency,
          },
          location_id: locationId,
        },
      }),
    });

    const paymentLink = response?.payment_link;
    if (!paymentLink?.id || !paymentLink?.order_id || !paymentLink?.url) {
      throw new BadGatewayException('Square returned an incomplete payment link');
    }

    return {
      id: paymentLink.id,
      orderId: paymentLink.order_id,
      url: paymentLink.url,
    };
  }

  async isOrderPaid(orderId: string): Promise<boolean> {
    const [orderResponse, paymentsResponse] = await Promise.all([
      this.request(`/v2/orders/${encodeURIComponent(orderId)}`, { method: 'GET' }),
      this.request(`/v2/payments?order_id=${encodeURIComponent(orderId)}`, { method: 'GET' }),
    ]);

    if (orderResponse?.order?.state === 'COMPLETED') return true;
    return (paymentsResponse?.payments || []).some(
      (payment: any) => payment.status === 'COMPLETED' && payment.order_id === orderId,
    );
  }

  async deletePaymentLink(paymentLinkId: string): Promise<void> {
    await this.request(
      `/v2/online-checkout/payment-links/${encodeURIComponent(paymentLinkId)}`,
      { method: 'DELETE' },
    );
  }

  private async request(path: string, init: RequestInit): Promise<any> {
    const token = this.requiredConfig('SQUARE_ACCESS_TOKEN');
    const controller = new AbortController();
    const timeoutMs = Number(this.config.get('SQUARE_TIMEOUT_MS') ?? 8000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl()}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Square-Version': this.config.get('SQUARE_API_VERSION') || '2026-05-20',
          ...(init.headers ?? {}),
        },
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const message = data?.errors?.map((error: any) => error.detail || error.code).join(', ');
        throw new BadGatewayException(message || `Square request failed (${response.status})`);
      }
      return data;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new ServiceUnavailableException('Square did not respond in time');
      }
      if (error instanceof BadGatewayException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException('Square is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private requiredConfig(key: string): string {
    const value = this.config.get<string>(key)?.trim();
    if (!value) throw new BadRequestException(`${key} is not configured`);
    return value;
  }

  private baseUrl(): string {
    return this.config.get('SQUARE_ENVIRONMENT') === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
  }
}
