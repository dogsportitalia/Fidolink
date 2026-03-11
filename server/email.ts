import { Resend } from 'resend';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let resendClient: { client: Resend; fromEmail: string } | null = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.log('Email service not configured (set RESEND_API_KEY and RESEND_FROM_EMAIL)');
    return null;
  }

  resendClient = {
    client: new Resend(apiKey),
    fromEmail,
  };
  return resendClient;
}

interface ScanNotificationData {
  publicId: string;
  dogName: string;
  scanTime: Date;
  userAgent?: string;
  city?: string;
  locationUrl?: string;
}

// Send scan notification to merchant
export async function sendMerchantNotification(data: ScanNotificationData) {
  const merchantEmail = process.env.MERCHANT_EMAIL;
  if (!merchantEmail) {
    console.log('MERCHANT_EMAIL not configured, skipping merchant notification');
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.log('Email service not available, skipping merchant notification');
    return;
  }

  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: merchantEmail,
      subject: `[FidoLink] Scansione medaglietta: ${escapeHtml(data.dogName)}`,
      html: `
        <h2>Nuova scansione medaglietta</h2>
        <p><strong>Medaglietta:</strong> ${escapeHtml(data.publicId)}</p>
        <p><strong>Nome cane:</strong> ${escapeHtml(data.dogName)}</p>
        <p><strong>Data/Ora:</strong> ${data.scanTime.toLocaleString('it-IT')}</p>
        ${data.city ? `<p><strong>Città:</strong> ${escapeHtml(data.city)}</p>` : ''}
        ${data.userAgent ? `<p><strong>Dispositivo:</strong> ${escapeHtml(data.userAgent.substring(0, 100))}</p>` : ''}
      `,
    });
    console.log('Merchant notification sent');
  } catch (error) {
    console.error('Failed to send merchant notification:', error);
  }
}

// Send scan notification to owner
export async function sendOwnerNotification(ownerEmail: string, data: ScanNotificationData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('Email service not available, skipping owner notification');
    return;
  }

  try {
    // Build location info if location URL is available
    let locationHtml = '';
    if (data.locationUrl) {
      locationHtml = `
        <div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #2e7d32;">Posizione GPS rilevata!</p>
          <p style="margin: 0 0 8px 0;">Chi ha scansionato ha condiviso la sua posizione.</p>
          <a href="${data.locationUrl}" target="_blank" style="display: inline-block; background-color: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Apri la posizione (disponibile per 30 giorni)</a>
        </div>
      `;
    }

    await resend.client.emails.send({
      from: resend.fromEmail,
      to: ownerEmail,
      subject: `[FidoLink] Qualcuno ha scansionato la medaglietta di ${escapeHtml(data.dogName)}!`,
      html: `
        <h2>La medaglietta di ${escapeHtml(data.dogName)} è stata scansionata!</h2>
        <p>Qualcuno ha appena scansionato il codice QR sulla medaglietta del tuo cane.</p>
        <p><strong>Data/Ora:</strong> ${data.scanTime.toLocaleString('it-IT')}</p>
        ${locationHtml}
        <p>Se non riconosci questa attività, il tuo cane potrebbe essersi perso. Controlla subito!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Questo messaggio è stato inviato automaticamente da FidoLink.</p>
      `,
    });
    console.log('Owner notification sent');
  } catch (error) {
    console.error('Failed to send owner notification:', error);
  }
}

// Send welcome email after registration
export async function sendWelcomeEmail(userEmail: string) {
  const resend = getResendClient();
  if (!resend) {
    console.log('Email service not available, skipping welcome email');
    return;
  }

  const legalUrl = process.env.APP_URL ? `${process.env.APP_URL}/legal` : 'https://fidolink.net/legal';

  const logoUrl = process.env.APP_URL ? `${process.env.APP_URL}/favicon.png` : 'https://fidolink.net/favicon.png';

  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: userEmail,
      subject: 'Benvenuto in FidoLink!',
      html: `
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${logoUrl}" alt="FidoLink" style="width: 120px; height: auto;" />
        </div>
        <h2>Ciao,</h2>
        <p>la tua registrazione a <strong>FidoLink</strong> è avvenuta con successo.</p>
        
        <p>Ora puoi accedere al tuo account e:</p>
        <ul>
          <li>registrare la medaglietta QR acquistata tramite il relativo codice;</li>
          <li>inserire o modificare i dati del tuo cane;</li>
          <li>gestire le informazioni che saranno visibili quando la medaglietta verrà scansionata.</li>
        </ul>

        <h3>Informazioni importanti</h3>
        <p>Utilizzando FidoLink confermi di essere consapevole che:</p>
        <ul>
          <li>i dati che inserisci nel profilo del cane saranno pubblicamente visibili a chiunque scansioni la medaglietta QR;</li>
          <li>i contatti associati al profilo (telefono e WhatsApp) potranno essere utilizzati da terzi per finalità di contatto;</li>
          <li>il servizio non garantisce il ritrovamento del cane, ma fornisce esclusivamente uno strumento di identificazione e comunicazione;</li>
          <li>sei responsabile dell'accuratezza e dell'aggiornamento delle informazioni inserite.</li>
        </ul>

        <p>Puoi consultare in qualsiasi momento l'Informativa legale e Privacy Policy al seguente link:<br>
        <a href="${legalUrl}">${legalUrl}</a></p>

        <p>Per assistenza o richieste relative ai tuoi dati personali puoi scrivere a:<br>
        <a href="mailto:fidolinkdogsport@gmail.com">fidolinkdogsport@gmail.com</a></p>

        <p>Grazie per aver scelto FidoLink.</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">Questo messaggio è stato inviato automaticamente da FidoLink.</p>
      `,
    });
    console.log('Welcome email sent to', userEmail);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

// Send contact form message
export async function sendContactEmail(senderEmail: string, message: string) {
  const resend = getResendClient();
  if (!resend) {
    console.log('Email service not available, skipping contact email');
    return false;
  }

  const recipientEmail = process.env.CONTACT_EMAIL || 'fidolinkdogsport@gmail.com';

  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `[FidoLink] Nuovo messaggio dal form contatti`,
      html: `
        <h2>Nuovo messaggio dal form contatti</h2>
        <p><strong>Email mittente:</strong> ${escapeHtml(senderEmail)}</p>
        <hr>
        <p><strong>Messaggio:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Puoi rispondere direttamente a questa email per contattare l'utente.</p>
      `,
    });
    console.log('Contact email sent from', senderEmail);
    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const resend = getResendClient();
  if (!resend) {
    console.log('Email service not available, skipping password reset email');
    return false;
  }

  const resetUrl = process.env.APP_URL 
    ? `${process.env.APP_URL}/reset-password?token=${resetToken}` 
    : `https://fidolink.net/reset-password?token=${resetToken}`;

  const logoUrl = process.env.APP_URL ? `${process.env.APP_URL}/favicon.png` : 'https://fidolink.net/favicon.png';

  try {
    await resend.client.emails.send({
      from: resend.fromEmail,
      to: userEmail,
      subject: '[FidoLink] Recupero password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header with logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
                      <img src="${logoUrl}" alt="FidoLink" style="width: 80px; height: 80px; margin-bottom: 16px;" />
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Recupero Password</h1>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        Ciao,<br><br>
                        Hai richiesto di reimpostare la password del tuo account <strong>FidoLink</strong>.
                      </p>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        Clicca il pulsante qui sotto per creare una nuova password:
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);">
                              Reimposta Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; margin: 24px 0;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
                              <strong>Importante:</strong> Questo link scadrà tra 1 ora.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Alternative link -->
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
                        Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
                      </p>
                      <p style="color: #f97316; font-size: 13px; word-break: break-all; margin: 8px 0 0 0;">
                        <a href="${resetUrl}" style="color: #f97316;">${resetUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Security notice -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">
                        <strong>Non hai richiesto tu questo reset?</strong><br>
                        Ignora questa email e la tua password rimarrà invariata. Se pensi che qualcuno stia tentando di accedere al tuo account, contattaci.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        FidoLink - La medaglietta smart per il tuo cane
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
                        Questo messaggio è stato inviato automaticamente.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log('Password reset email sent to', userEmail);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}
