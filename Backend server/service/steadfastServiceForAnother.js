const axios = require('axios');

const steadfastClient = axios.create({
  baseURL: process.env.STEADFAST_BASE_URL,
  headers: {
    'Api-Key': process.env.STEADFAST_API_KEY2,
    'Secret-Key': process.env.STEADFAST_SECRET_KEY2,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

function toLocalPhone(phone) {
  if (!phone) return phone;
  if (phone.startsWith('+880')) return '0' + phone.slice(4);
  if (phone.startsWith('880')) return '0' + phone.slice(3);
  return phone;
}

async function createSteadfastOrderSecond({
  invoice,
  recipientName,
  recipientPhone,
  recipientAddress,
  codAmount,
  note = '',
}) {
  try {
    const { data } = await steadfastClient.post('/create_order', {
      invoice,
      recipient_name: recipientName,
      recipient_phone: toLocalPhone(recipientPhone),
      recipient_address: recipientAddress,
      cod_amount: codAmount,
      note,
    });
    return { success: true, data };
  } catch (error) {
    console.error(
      'Steadfast order creation failed:',
      error.response?.data || error.message,
    );
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

module.exports = { createSteadfastOrderSecond };
