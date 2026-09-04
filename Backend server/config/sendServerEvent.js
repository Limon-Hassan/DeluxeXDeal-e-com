const crypto = require('crypto');

const sendServerEvent = async (eventName, eventData = {}, req, config = {}) => {
  try {
    const pixelId = config.pixelId || process.env.META_PIXEL_ID;
    const accessToken = config.accessToken || process.env.META_ACCESS_TOKEN;

    const testEventCode = config.testEventCode || process.env.META_TEST_EVENT;

    if (!pixelId || !accessToken) {
      throw new Error('Pixel ID or Access Token missing');
    }

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

            fbp: req?.cookies?._fbp || undefined,

            fbc: req?.cookies?._fbc || undefined,

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
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(`META EVENT → ${pixelId}`, data);

    return data;
  } catch (err) {
    console.error('Meta Pixel Server Error:', err);
    return null;
  }
};

module.exports = {
  sendServerEvent,
};
