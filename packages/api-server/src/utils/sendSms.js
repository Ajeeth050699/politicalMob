const axios = require('axios');

const sendSms = async ({ message, numbers }) => {
  try {
    const data = {
      sender_id: 'FSTSMS',
      message,
      language: 'english',
      route: 'v3',
      numbers,
    };

    const config = {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', data, config);

    // Fast2SMS API returns "return: true" on success
    if (response.data.return) {
      console.log(`SMS sent successfully to ${numbers}`);
    } else {
      console.error(`Failed to send SMS to ${numbers}:`, response.data.message);
    }
  } catch (error) {
    console.error('Error sending SMS via Fast2SMS:', error.message);
    if (error.response) {
      console.error('Fast2SMS Error Response:', error.response.data);
    }
  }
};

module.exports = sendSms;
