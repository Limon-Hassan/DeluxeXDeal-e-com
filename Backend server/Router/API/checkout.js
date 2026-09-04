let express = require('express');
const {
  AdminReadCheckout,
  deleteCheckout,
  getSavedInfo,
  directCheckout,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  steadfastWebhook,
  sendToSteadfast,
  steadfastWebhook2,
  AdminReadCheckoutSecond,
  bulkUpdateOrderStatusSecond,
  updateOrderStatusSecond,
  sendToSteadfastSecond,
} = require('../../AllHandler/checkoutHandler');
let router = express.Router();

// router.post('/makeCheckout', makeCheckout);
router.post('/directCheckout', directCheckout);
router.get('/AdminReadCheckout', AdminReadCheckout);
router.get('/AdminReadCheckout/second', AdminReadCheckoutSecond);
router.patch('/status/:id', updateOrderStatus);
router.patch('status/second/:id/', updateOrderStatusSecond);
router.post('/send-to-steadfast/:id', sendToSteadfast);
router.post('/send-to-steadfast/second/:id', sendToSteadfastSecond);
router.patch('/bulk-status', bulkUpdateOrderStatus);
router.patch('/bulk-status/second', bulkUpdateOrderStatusSecond);
router.get('/getSavedInfo', getSavedInfo);
router.delete('/deleteChechout', deleteCheckout);
router.post('/webhook/steadfast', steadfastWebhook);
router.post('/webhook/steadfast2', steadfastWebhook2);

module.exports = router;
