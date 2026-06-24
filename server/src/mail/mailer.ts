import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { config } from '../config';

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

const getTransporter = (): nodemailer.Transporter<SMTPTransport.SentMessageInfo> => {
  if (!config.smtp.enabled) {
    throw new Error('SMTP não configurado');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? {
            user: config.smtp.user,
            pass: config.smtp.pass,
          }
        : undefined,
    });
  }

  return transporter;
};

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendMail = async (input: SendMailInput): Promise<void> => {
  const transport = getTransporter();
  await transport.sendMail({
    from: config.smtp.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
};

export const verifySmtpConnection = async (): Promise<boolean> => {
  if (!config.smtp.enabled) return false;
  try {
    await getTransporter().verify();
    return true;
  } catch {
    return false;
  }
};
