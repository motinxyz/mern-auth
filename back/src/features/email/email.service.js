import sendMail from "../../utils/sendMail.js";
import config from "../../config/env.js";

/**
 * Creates the HTML body for a verification email.
 * @param {object} options - The options for the email.
 * @param {string} options.name - The user's name.
 * @param {string} options.verificationUrl - The URL for email verification.
 * @param {function} options.t - The translation function.
 * @returns {string} The HTML content of the email.
 */
const createVerificationEmailBody = ({ name, verificationUrl, t }) => {
  const minutes = Math.round(Number(config.verificationTokenExpiresIn) / 60);
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h1 style="color: #333;">${t("email:verification.title")}</h1>
      </div>
      <div style="padding: 20px;">
        <p>${t("email:verification.greeting", { name })}</p>
        <p>${t("email:verification.body")}</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
            ${t("email:verification.button")}
          </a>
        </div>
        <p>${t("email:verification.expiry", { count: minutes })}</p>
        <p>
          ${t("email:verification.linkNotWorking")}
          <br>
          <a href="${verificationUrl}" style="color: #007bff;">${verificationUrl}</a>
        </p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        <p>Mern Auth</p>
      </div>
    </div>
  `;
};

/**
 * Sends a verification email to a new user.
 * @param {object} user - The user object.
 * @param {string} token - The verification token.
 * @param {function} t - The translation function.
 */
export const sendVerificationEmail = async ({ user, token, t }) => {
  const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const subject = t("email:verification.subject");
  const html = createVerificationEmailBody({
    name: user.name,
    verificationUrl,
    t,
  });

  // create a plain text version of the email
  const text = html.replace(/<[^>]*>/g, "");

  await sendMail({ to: user.email, subject, html, text });
};