let crypto = require('crypto');

const sendServerEvent = async (eventName, eventData = {}, req) => {
  try {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testEventCode = process.env.META_TEST_EVENT;

    if (!pixelId || !accessToken)
      throw new Error('Pixel ID or Access Token missing from env');

    const url = `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventData.event_id || `${eventName}-${Date.now()}`,
          action_source: 'website',
          user_data: {
            client_ip_address: eventData.ip,
            client_user_agent: eventData.ua,
            fbp: req && req.cookies ? req.cookies['_fbp'] : undefined,
            fbc: req && req.cookies ? req.cookies['_fbc'] : undefined,
            em: eventData.email
              ? crypto
                  .createHash('sha256')
                  .update(eventData.email.trim().toLowerCase())
                  .digest('hex')
              : undefined,
            ph: eventData.phone
              ? crypto
                  .createHash('sha256')
                  .update(eventData.phone.replace(/\D/g, ''))
                  .digest('hex')
              : undefined,
          },
          custom_data: eventData.custom_data || {},
        },
      ],
      test_event_code: testEventCode,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Meta Pixel Server Error:', err);
  }
};

module.exports = { sendServerEvent };
