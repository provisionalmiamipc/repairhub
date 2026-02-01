import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Método específico para empleados
  async sendEmployeeWelcomeEmail(
    employee: {
      email: string;
      firstName: string;
      lastName: string;
      employeeCode: string;
    },
    tempPassword: string,
    pin: string,
  ): Promise<void> {
    const subject = 'Bienvenido - Tus Credenciales de Acceso';
    
    const html = this.getWelcomeEmailTemplate(
      employee.firstName,
      employee.lastName,
      employee.employeeCode,
      tempPassword,
      pin,
    );

    await this.sendEmail({
      to: employee.email,
      subject,
      html,
    });
  }

  private getWelcomeEmailTemplate(
    firstName: string,
    lastName: string,
    employeeCode: string,
    tempPassword: string,
    pin: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .credentials { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Nuestra Empresa!</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${firstName} ${lastName}</strong>,</p>
            <p>Tu cuenta ha sido creada exitosamente. Aquí tienes tus credenciales de acceso:</p>
            
            <div class="credentials">
              <h3>🔐 Tus Credenciales:</h3>
              <p><strong>Email:</strong> ${employeeCode}@tuempresa.com</p>
              <p><strong>Código de Empleado:</strong> ${employeeCode}</p>
              <p><strong>Contraseña Temporal:</strong> ${tempPassword}</p>
              <p><strong>PIN de Seguridad:</strong> ${pin}</p>
            </div>

            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>Guarda esta información en un lugar seguro</li>
              <li>Cambia tu contraseña en tu primer acceso</li>
              <li>El PIN se usará para verificaciones de seguridad</li>
            </ul>

            <p>Puedes acceder al sistema aquí: 
              <a href="https://tudominio.com/login" style="color: #007bff;">
                https://tudominio.com/login
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2024 Tu Empresa. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}