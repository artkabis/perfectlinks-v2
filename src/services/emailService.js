const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Email configuration from environment variables
const emailConfig = {
  host: process.env.MAILSENDER_HOST || 'smtp.example.com',
  port: parseInt(process.env.MAILSENDER_PORT, 10) || 587,
  secure: process.env.MAILSENDER_SECURE === 'true',
  auth: {
    user: process.env.MAILSENDER_USERNAME,
    pass: process.env.MAILSENDER_PASSWORD,
  },
};

const fromAddress = process.env.MAILSENDER_FROM || 'Perfect Links <noreply@perfectlinks.fr>';
const validationUrl = process.env.EMAIL_VALIDATION_URL || 'http://localhost:9090/api/validate-account';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  /**
   * Initialize the email transporter
   */
  async initialize() {
    try {
      // Check if email is configured
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Email service not configured (missing credentials). Email features will be disabled.');
        this.isConfigured = false;
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection (with timeout to avoid hanging)
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email verification timeout')), 5000)
        )
      ]);

      logger.info('Email service initialized successfully');
      this.isConfigured = true;
    } catch (error) {
      // Log error message only (not the full error object which may have circular refs)
      logger.warn(`Email service initialization failed: ${error.message}. Email features will be disabled.`);
      this.isConfigured = false;
      // Don't throw - email is optional, the API should still work
    }
  }

  /**
   * Check if email service is configured and ready
   * @returns {boolean} True if configured
   */
  isReady() {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send validation email to new user
   * @param {Object} user - User object
   * @param {string} validationToken - Validation token
   * @returns {Promise<boolean>} Success status
   */
  async sendValidationEmail(user, validationToken) {
    if (!this.isReady()) {
      logger.warn('Email service not configured, skipping validation email');
      return false;
    }

    try {
      const validationLink = `${validationUrl}?token=${validationToken}&userid=${user.user_id}`;

      const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Validez votre compte Perfect Links',
        html: this.getValidationEmailTemplate(user.username, validationLink),
        text: this.getValidationEmailText(user.username, validationLink),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Validation email sent to: ${user.email} (messageId: ${info.messageId})`);
      return true;
    } catch (error) {
      logger.error('Error sending validation email:', error);
      return false;
    }
  }

  /**
   * Send welcome email after account validation
   * @param {Object} user - User object
   * @returns {Promise<boolean>} Success status
   */
  async sendWelcomeEmail(user) {
    if (!this.isReady()) {
      logger.warn('Email service not configured, skipping welcome email');
      return false;
    }

    try {
      const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'Bienvenue sur Perfect Links !',
        html: this.getWelcomeEmailTemplate(user.username, user.plan),
        text: this.getWelcomeEmailText(user.username, user.plan),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to: ${user.email} (messageId: ${info.messageId})`);
      return true;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send quota warning email
   * @param {Object} user - User object
   * @param {number} remaining - Remaining quota
   * @param {number} limit - Total quota limit
   * @returns {Promise<boolean>} Success status
   */
  async sendQuotaWarningEmail(user, remaining, limit) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const percentage = Math.round((remaining / limit) * 100);

      const mailOptions = {
        from: fromAddress,
        to: user.email,
        subject: `Attention : ${percentage}% de quota restant`,
        html: this.getQuotaWarningEmailTemplate(user.username, remaining, limit, percentage),
        text: this.getQuotaWarningEmailText(user.username, remaining, limit, percentage),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Quota warning email sent to: ${user.email} (messageId: ${info.messageId})`);
      return true;
    } catch (error) {
      logger.error('Error sending quota warning email:', error);
      return false;
    }
  }

  /**
   * HTML template for validation email
   */
  getValidationEmailTemplate(username, validationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔗 Perfect Links</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${username},</h2>
            <p>Bienvenue sur Perfect Links ! Nous sommes ravis de vous compter parmi nous.</p>
            <p>Pour activer votre compte et commencer à analyser vos sites web, veuillez cliquer sur le bouton ci-dessous :</p>
            <p style="text-align: center;">
              <a href="${validationLink}" class="button">Valider mon compte</a>
            </p>
            <p><small>Ce lien est valide pendant 24 heures.</small></p>
            <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${validationLink}
            </p>
            <p>Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Perfect Links - Analyse de maillage interne</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plain text version of validation email
   */
  getValidationEmailText(username, validationLink) {
    return `
Bonjour ${username},

Bienvenue sur Perfect Links ! Nous sommes ravis de vous compter parmi nous.

Pour activer votre compte et commencer à analyser vos sites web, veuillez cliquer sur le lien ci-dessous :

${validationLink}

Ce lien est valide pendant 24 heures.

Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.

---
© 2024 Perfect Links - Analyse de maillage interne
    `.trim();
  }

  /**
   * HTML template for welcome email
   */
  getWelcomeEmailTemplate(username, plan) {
    const limits = {
      free: 100,
      premium: 500,
      pro: 1000,
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Compte activé !</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${username} !</h2>
            <p>Votre compte Perfect Links est maintenant actif.</p>
            <p><strong>Votre plan :</strong> ${plan.toUpperCase()} (${limits[plan]} requêtes/mois)</p>

            <h3>Fonctionnalités disponibles :</h3>
            <div class="feature">✅ Analyse de sitemap.xml</div>
            <div class="feature">✅ Crawl des liens internes</div>
            <div class="feature">✅ Détection des liens orphelins</div>
            <div class="feature">✅ Analyse des textes d'ancre</div>
            <div class="feature">✅ Vérification des statuts HTTP</div>

            <p>Vous pouvez maintenant commencer à analyser vos sites web !</p>
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
          </div>
          <div class="footer">
            <p>© 2024 Perfect Links - Analyse de maillage interne</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plain text version of welcome email
   */
  getWelcomeEmailText(username, plan) {
    const limits = {
      free: 100,
      premium: 500,
      pro: 1000,
    };

    return `
Félicitations ${username} !

Votre compte Perfect Links est maintenant actif.

Votre plan : ${plan.toUpperCase()} (${limits[plan]} requêtes/mois)

Fonctionnalités disponibles :
- Analyse de sitemap.xml
- Crawl des liens internes
- Détection des liens orphelins
- Analyse des textes d'ancre
- Vérification des statuts HTTP

Vous pouvez maintenant commencer à analyser vos sites web !

Pour toute question, n'hésitez pas à nous contacter.

---
© 2024 Perfect Links - Analyse de maillage interne
    `.trim();
  }

  /**
   * HTML template for quota warning email
   */
  getQuotaWarningEmailTemplate(username, remaining, limit, percentage) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Attention Quota</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${username},</h2>
            <p>Votre quota d'utilisation approche de sa limite.</p>
            <div class="warning">
              <strong>Quota restant :</strong> ${remaining} / ${limit} requêtes (${percentage}%)<br>
            </div>
            <p>Pensez à upgrader votre plan pour continuer à profiter de Perfect Links sans interruption.</p>
            <p>Les quotas sont réinitialisés tous les 30 jours.</p>
          </div>
          <div class="footer">
            <p>© 2024 Perfect Links - Analyse de maillage interne</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plain text version of quota warning email
   */
  getQuotaWarningEmailText(username, remaining, limit, percentage) {
    return `
Bonjour ${username},

Votre quota d'utilisation approche de sa limite.

Quota restant : ${remaining} / ${limit} requêtes (${percentage}%)

Pensez à upgrader votre plan pour continuer à profiter de Perfect Links sans interruption.

Les quotas sont réinitialisés tous les 30 jours.

---
© 2024 Perfect Links - Analyse de maillage interne
    `.trim();
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
