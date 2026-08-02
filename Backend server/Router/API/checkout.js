let express = require('express');
const {
  makeCheckout,
  AdminReadCheckout,
  deleteCheckout,
  getSavedInfo,
  directCheckout,
  updateOrderStatus,
  bulkUpdateOrderStatus,
} = require('../../AllHandler/checkoutHandler');
let router = express.Router();

router.post('/makeCheckout', makeCheckout);
router.post('/directCheckout', directCheckout);
router.get('/AdminReadCheckout', AdminReadCheckout);
router.patch('/status/:id', updateOrderStatus);
router.patch('/bulk-status', bulkUpdateOrderStatus);
router.get('/getSavedInfo', getSavedInfo);
router.delete('/deleteChechout', deleteCheckout);

module.exports = router;
