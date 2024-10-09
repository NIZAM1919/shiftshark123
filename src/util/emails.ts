import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-south-1',
});

interface UserProfile {
  email: string;
  name: string;
  phone: string;
  userID: string;
}

export const sendProfileVerificationEmail = async ({
  email,
  name,
  phone,
  userID,
}: UserProfile): Promise<{ success: boolean; response: any }> => {
  const ses = new AWS.SES();
  if (process.env.NODE_ENV != 'production') {
    return {
      success: true,
      response: 'success',
    };
  }

  const params = {
    Source: 'Shiftshark Admin <admin.verification@shiftshark.in>',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Your Profile Has Been Verified - ShiftShark',
      },
      Body: {
        Html: {
          Data: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 30px;
                            text-align: left;
                            background-color: #ffffff;
                            border: 1px solid #e0e0e0;
                            border-radius: 10px;
                        }
                        h1 {
                            font-size: 24px;
                            color: #333333;
                        }
                        .content {
                            margin-top: 20px;
                            font-size: 16px;
                            color: #555555;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 12px;
                            color: #999999;
                        }
                        .highlight {
                            font-weight: bold;
                            color: #2c3e50;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Dear ${name},</h1>
                        <p class="content">
                            We are pleased to inform you that your profile has been successfully verified by the admin at <span class="highlight">ShiftShark</span>.
                        </p>
                        <p class="content">
                            Here are your details for your reference:
                        </p>
                        <ul class="content">
                            <li><strong>Name:</strong> ${name}</li>
                            <li><strong>Email:</strong> ${email}</li>
                            <li><strong>Phone:</strong> ${phone}</li>
                            <li><strong>User ID:</strong> ${userID}</li>
                        </ul>
                        <p class="content">
                            We are excited to have you on board and wish you a wonderful hiring experience with us.
                        </p>
                        <p class="content">
                            You can now fully access all our features and services. If you have any questions or need further assistance, feel free to reach out to us at ${'info@shiftshark.in'}
                        </p>
                        <p class="content">
                            Thank you for being a valued member of ShiftShark!
                        </p>
                        <div class="footer">
                            Best Regards,<br/>
                            ShiftShark Team
                        </div>
                    </div>
                </body>
            </html>
          `,
        },
      },
    },
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return {
      success: true,
      response,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      response: err,
    };
  }
};

export const sendOTPViaEmail = async (otp: string, email: string) => {
  const ses = new AWS.SES();

  const params = {
    Source: 'Shiftshark Login <notifications.no-reply@shiftshark.in>',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Your Shift Shark sign-in OTP',
      },
      Body: {
        Html: {
          Data: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            text-align: center;
                            padding: 30px;
                        }
                        h1 {
                            font-size: 36px;
                            margin-bottom: 20px;
                        }
                        .otp {
                            background-color: #f5f5f5;
                            padding: 20px;
                            border-radius: 10px;
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>One-Time Password</h1>
                        <div class="otp">
                            ${otp}
                        </div>
                        <p>This is a one-time password. Do not share it with anyone.</p>
                    </div>
                </body>
            </html>
          `,
        },
      },
    },
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return {
      success: true,
      response,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      response: err,
    };
  }
};

export const sendJobStartOTPViaEmail = async (otp: string, email: string) => {
  const ses = new AWS.SES();

  const params = {
    Source: 'Shiftshark Jobs <jobs@shiftshark.in>',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Your Shift Shark Job Start OTP',
      },
      Body: {
        Html: {
          Data: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            text-align: center;
                            padding: 30px;
                        }
                        h1 {
                            font-size: 36px;
                            margin-bottom: 20px;
                        }
                        .otp {
                            background-color: #f5f5f5;
                            padding: 20px;
                            border-radius: 10px;
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Job Start One-Time Password</h1>
                        <div class="otp">
                            ${otp}
                        </div>
                        <p>This is a one-time password. Share it with the hirer when you start the job.</p>
                    </div>
                </body>
            </html>
          `,
        },
      },
    },
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return {
      success: true,
      response,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      response: err,
    };
  }
};
