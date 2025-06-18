export default function generateResetPasswordTemplate(mailOptions: any) {
  console.log(mailOptions);
  const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
            overflow: hidden;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .content {
            padding: 20px;
            color: #333333;
            line-height: 1.6;
        }
        .button-container {
            text-align: center;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            text-align: center;
            color: #777777;
            font-size: 12px;
            padding: 10px 20px;
            border-top: 1px solid #dddddd;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi ${mailOptions.userData.name},</p>
            <p>We received a request to reset your password. If you did not request this, please ignore this email. Otherwise, click the button below to reset your password:</p>
            <div class="button-container">
                <a href="${mailOptions.resetLink}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can also reset your password by copying and pasting the link below into your browser:</p>
            <p><a href="${mailOptions.resetLink}">[RESET_LINK]</a></p>
        </div>
        <div class="footer">
            <p>If you have any questions, feel free to contact us.</p>
            <p>&copy; 2025 Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
  const EmailAndPasswordTemplate = {
    subject: 'Password Reset',
    html: template,
  };
  return EmailAndPasswordTemplate;
}
