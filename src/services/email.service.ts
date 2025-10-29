import nodemailer from 'nodemailer';

// Create a reusable transporter object using Ethereal SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.ETHEREAL_HOST,
  port: parseInt(process.env.ETHEREAL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASS,
  },
});

/**
 * Sends a mock verification email to a new user.
 * @param userEmail - The email address of the recipient.
 */
export const sendVerificationEmail = async (userEmail: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Event App Admin" <admin@eventapp.com>',
      to: userEmail,
      subject: 'Welcome to the Event Management App!',
      text: 'Welcome! Your account has been successfully created. (This is a mock email).',
      html: '<b>Welcome!</b><p>Your account has been successfully created.</p><p>(This is a mock email).</p>',
    });

    console.log('Mock email sent: %s', info.messageId);
    // Log the preview URL to the console
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending mock email:', error);
  }
};