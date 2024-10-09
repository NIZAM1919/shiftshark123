import { makeApiCall } from './api';
import { AxiosRequestConfig } from 'axios';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { sendOTPViaEmail } from './emails';

export const sendOTP = async (
  otp: string,
  phone?: string,
  email?: string,
): Promise<any> => {
  if (process.env.NODE_ENV != 'production') {
    return {
      success: true,
    };
  }
  if (phone) return await sendOTPViaSms(otp, phone);
  if (email) return await sendOTPViaEmail(otp, email);
  return {
    success: false,
  };
};

const sendOTPViaSms = async (otp: string, phone: string) => {
  const apiKey = process.env.SMS_API_KEY;
  const baseURL = `https://2factor.in/API/V1/${apiKey}/SMS/+91${phone}/${otp}/otp_default`;

  const url = `${baseURL}`;
  const config: AxiosRequestConfig = {
    method: 'get',
    url: url,
  };

  const response = await makeApiCall(config);
  if (response.error) {
    return {
      success: false,
      response,
    };
  }
  return {
    success: true,
    response,
  };
};
const sendOTPViaEmail_mailgun = async (otp: string, email: string) => {
  // to be used if mailgun is email service provider
  const DOMAIN = 'mg.shiftshark.in';
  const API_KEY = process.env.MAILGUN_API_KEY;

  const mailgun = new Mailgun(formData);
  const client = mailgun.client({ username: 'api', key: API_KEY });

  const messageData = {
    from: 'Shiftshark <notifications.no-reply@mg.shiftshark.in>',
    to: email,
    subject: 'Your Shift Shark sign-in OTP',
    html: `
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
  };
  try {
    const response = await client.messages.create(DOMAIN, messageData);
    return {
      success: response?.status == 200,
      response,
    };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      response: err,
    };
  }
};
