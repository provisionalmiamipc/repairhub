const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user;
  if (!host || !user || !pass) {
    console.error('Missing SMTP env vars');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host, port, secure: false, auth: { user, pass },
    logger: true, debug: true
  });

  await transporter.verify();
  console.log('SMTP verified OK');

  const info = await transporter.sendMail({
    from: `${process.env.FROM_NAME ? process.env.FROM_NAME + ' <' + from + '>' : from}`,
    to: 'solucionestiale@gmail.com',
    subject: 'Prueba de envío SMTP desde repairhub-api',
    text: 'Este es un correo de prueba enviado desde el script local (sin tocar código fuente).',
    html: '<p>Este es un correo de prueba enviado desde el script local (sin tocar código fuente).</p>',
    attachments: [
      ...(fs.existsSync('/tmp/service-order-SO00022.pdf') ? [{ filename: 'service-order-SO00022.pdf', path: '/tmp/service-order-SO00022.pdf', contentType: 'application/pdf' }] : [])
    ]
  });

  console.log('Message sent:', info);
}

main().catch(err => { console.error(err); process.exit(1); });
