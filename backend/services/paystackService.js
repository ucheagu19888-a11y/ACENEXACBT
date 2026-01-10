import axios from 'axios';
import { config } from '../config/env.js';

class PaystackService {
  constructor() {
    this.baseUrl = 'https://api.paystack.co';
    this.secretKey = config.paystackSecretKey;
  }

  async verifyTransaction(reference) {
    if (!this.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const url = `${this.baseUrl}/transaction/verify/${reference}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  }

  validateWebhook(payload, signature) {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }
}

export default new PaystackService();
