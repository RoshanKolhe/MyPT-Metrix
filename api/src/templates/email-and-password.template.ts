export default function generateEmailAndPasswordTemplate(mailOptions: any) {
  const template = `<!DOCTYPE html>
    <html>
    <head>
        <title>Welcome to Hylite</title>
    </head>
     <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            background: #007bff;
            color: #ffffff;
            padding: 15px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
            font-size: 16px;
            color: #333;
        }
        .button {
            display: inline-block;
            background: #007bff;
            color: #ffffff;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #666;
            padding: 10px;
            margin-top: 20px;
            border-top: 1px solid #ddd;
        }
    </style>
 <body>

<div class="container">
    <div class="header">
        <h2>Welcome to Hylite!</h2>
    </div>

    <div class="content">
        <p>Dear <strong>${mailOptions?.userData?.firstName} ${mailOptions?.userData?.lastName ? mailOptions?.userData?.lastName : ''}</strong>,</p>
        
        <p>We are excited to have you on board. Below are your login details:</p>

        <p><strong>Login URL:</strong> <a href="${mailOptions?.loginLink}" target="_blank">${mailOptions?.loginLink}</a></p>
        <p><strong>Email:</strong>${mailOptions?.userData?.email}</p>
        <p><strong>Password:</strong> ${mailOptions?.decryptedPassword}</p>

        <p>For security reasons, we recommend changing your password as soon as possible.</p>

        <h3>How to Reset Your Password:</h3>
        <ol>
            <li>Log in to your account using the above credentials.</li>
            <li>Go to your <strong>Profile</strong> section.</li>
            <li>Select the <strong>Security</strong> tab.</li>
            <li>Enter your current password and then enter a new password.</li>
            <li>Save the changes.</li>
        </ol>

        <p>Click the button below to log in now:</p>
        <p><a class="button" href="${mailOptions?.loginLink}" target="_blank">Login Now</a></p>

        <p>If you have any issues, feel free to contact our support team.</p>

        <p>Best Regards,<br>
        <strong>Hylite</strong></p>
    </div>

    <div class="footer">
        &copy; 2025 Hylite. All rights reserved.
    </div>
</div>

</body>
    </html>`;
  const EmailAndPasswordTemplate = {
    subject: 'Welcome to Hylite - Your Account Details Inside!',
    html: template,
  };
  return EmailAndPasswordTemplate;
}
