import { config } from '../config';
import { CAMPUS_EMAIL_BRAND } from './brand';

export interface PasswordResetEmailContent {
  subject: string;
  text: string;
  html: string;
}

export const buildPasswordResetEmail = (params: {
  recipientName: string;
  resetLink: string;
  expiresInLabel: string;
}): PasswordResetEmailContent => {
  const { colors, fontFamily, name, tagline, year } = CAMPUS_EMAIL_BRAND;
  const greeting = params.recipientName.trim() || 'utilizador';
  const subject = `${name} — Redefinir password`;
  const logoUrl = `${config.clientUrl.replace(/\/$/, '')}/images/campus-logo.png`;

  const text = [
    `${name} · ${tagline}`,
    '',
    `Olá ${greeting},`,
    '',
    'Recebemos um pedido para redefinir a password da tua conta CAMPUS.',
    `Abre o link abaixo para escolher uma nova password (expira em ${params.expiresInLabel}):`,
    '',
    params.resetLink,
    '',
    'Se não fizeste este pedido, ignora este email — a tua password mantém-se inalterada.',
    '',
    `— Equipa ${name}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(subject)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:${colors.background};color:${colors.foreground};font-family:${fontFamily};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Redefine a password da tua conta ${escapeHtml(name)}. O link expira em ${escapeHtml(params.expiresInLabel)}.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.background};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid ${colors.border};background:${colors.surface};">
            <tr>
              <td style="height:4px;background:${colors.primary};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:28px 32px 20px;border-bottom:1px solid ${colors.border};background:linear-gradient(180deg, ${colors.surfaceElevated} 0%, ${colors.surface} 100%);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(name)}" width="148" height="44" style="display:block;border:0;outline:none;text-decoration:none;max-width:148px;height:auto;" />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 10px;border:1px solid ${colors.borderStrong};background:${colors.background};font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${colors.muted};">
                        Conta
                      </span>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:${colors.muted};">${escapeHtml(tagline)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${colors.primary};">
                  Segurança
                </p>
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;font-weight:800;color:${colors.foreground};">
                  Redefinir password
                </h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${colors.accent};">
                  Olá <strong style="color:${colors.foreground};font-weight:700;">${escapeHtml(greeting)}</strong>,
                </p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${colors.accent};">
                  Recebemos um pedido para redefinir a password da tua conta. Usa o botão abaixo para escolher uma nova password e voltar à biblioteca de podcasts.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="border-left:3px solid ${colors.primary};background:${colors.background};padding:12px 14px;">
                      <p style="margin:0;font-size:12px;line-height:1.5;color:${colors.muted};">
                        O link expira em <strong style="color:${colors.foreground};">${escapeHtml(params.expiresInLabel)}</strong>.
                      </p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:${colors.primary};">
                      <a href="${escapeHtml(params.resetLink)}" style="display:inline-block;padding:14px 24px;font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;color:${colors.onPrimary};">
                        Criar nova password
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.55;color:${colors.muted};">
                  Se o botão não funcionar, copia e cola este URL no browser:
                </p>
                <p style="margin:0;font-size:12px;line-height:1.55;word-break:break-all;">
                  <a href="${escapeHtml(params.resetLink)}" style="color:${colors.primary};text-decoration:underline;">${escapeHtml(params.resetLink)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${colors.border};background:${colors.background};">
                <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${colors.muted};">
                  Se não fizeste este pedido, ignora este email. A tua password mantém-se inalterada.
                </p>
                <p style="margin:0;font-size:11px;line-height:1.5;color:${colors.muted};">
                  ${escapeHtml(name)} · ${escapeHtml(year)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
