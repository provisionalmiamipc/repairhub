import 'dotenv/config';
import { Client } from 'pg';

interface VerificationResult {
  id: number;
  serviceOrderId: number;
  localStatus: string;
  squareStatus: string;
  consistent: boolean;
  lastCheckedAt: Date | null;
  lastError: string | null;
  queryError: string | null;
}

async function main() {
  const database = new Client(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || process.env.DB_NAME,
      });

  await database.connect();
  const { rows } = await database.query(`
    SELECT
      "id",
      "serviceOrderId",
      "status",
      "squarePaymentLinkId",
      "squareOrderId",
      "lastCheckedAt",
      "lastError"
    FROM "service_order_payment_links"
    ORDER BY "createdAt" DESC
    LIMIT 25
  `);
  await database.end();

  const baseUrl = process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
  const headers = {
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    'Square-Version': process.env.SQUARE_API_VERSION || '2026-05-20',
  };

  const results: VerificationResult[] = [];
  for (const link of rows) {
    let squareStatus = 'NOT_CHECKED';
    let error: string | null = null;

    try {
      if (link.status === 'deleted' && link.squarePaymentLinkId) {
        const response = await fetch(
          `${baseUrl}/v2/online-checkout/payment-links/${encodeURIComponent(link.squarePaymentLinkId)}`,
          { headers },
        );
        squareStatus = response.status === 404 ? 'DELETED' : `HTTP_${response.status}`;
      } else if (link.squareOrderId) {
        const response = await fetch(
          `${baseUrl}/v2/payments?order_id=${encodeURIComponent(link.squareOrderId)}`,
          { headers },
        );
        const body: any = await response.json();
        squareStatus = (body.payments || []).some((payment: any) => payment.status === 'COMPLETED')
          ? 'PAID'
          : 'PENDING';
        if (!response.ok) error = JSON.stringify(body.errors || body);
      }
    } catch (requestError: any) {
      error = requestError?.message || 'Square request failed';
    }

    results.push({
      id: link.id,
      serviceOrderId: link.serviceOrderId,
      localStatus: link.status,
      squareStatus,
      consistent:
        (link.status === 'paid' && squareStatus === 'PAID')
        || (link.status === 'pending' && squareStatus === 'PENDING')
        || (link.status === 'deleted' && squareStatus === 'DELETED')
        || link.status === 'failed',
      lastCheckedAt: link.lastCheckedAt,
      lastError: link.lastError,
      queryError: error,
    });
  }

  console.table(results);
  if (results.some(result => !result.consistent || result.queryError)) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
