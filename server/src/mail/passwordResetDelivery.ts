import { config } from '../config';
import { sendMail } from './mailer';
import { buildPasswordResetEmail } from './passwordResetEmail';

export interface PasswordResetDeliveryInput {
  email: string;
  recipientName: string;
  resetLink: string;
  expiresInLabel: string;
}

const logPasswordResetLink = (input: PasswordResetDeliveryInput): void => {
  console.info('[CAMPUS] ─── RESET DE PASSWORD (SMTP desactivado) ───────');
  console.info(`[CAMPUS] Email : ${input.email}`);
  console.info(`[CAMPUS] Link  : ${input.resetLink}`);
  console.info(`[CAMPUS] Expira: ${input.expiresInLabel}`);
  console.info('[CAMPUS] ─────────────────────────────────────────────────');
};

export const deliverPasswordResetEmail = async (
  input: PasswordResetDeliveryInput,
): Promise<void> => {
  if (!config.smtp.enabled) {
    logPasswordResetLink(input);
    return;
  }

  const content = buildPasswordResetEmail({
    recipientName: input.recipientName,
    resetLink: input.resetLink,
    expiresInLabel: input.expiresInLabel,
  });

  try {
    await sendMail({
      to: input.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    console.info(`[CAMPUS] Email de reset enviado para ${input.email}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[CAMPUS] Falha ao enviar email de reset para ${input.email}: ${message}`);

    if (config.nodeEnv === 'development') {
      logPasswordResetLink(input);
    }
  }
};
