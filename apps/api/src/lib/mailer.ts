import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
});

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  return transporter.sendMail({
    from: env.MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
