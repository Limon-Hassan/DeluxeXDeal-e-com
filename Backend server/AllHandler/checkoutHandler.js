const { sendServerEvent } = require('../config/sendServerEvent');
const cartSchema = require('../models/cartSchema');
const checkoutSchema = require('../models/checkoutSchema');
const productSchema = require('../models/productSchema');
const Save_info = require('../models/Save_info');
const { createSteadfastOrder } = require('../service/steadfastService');
const { getIO } = require('../socket_server');
const { v4: uuidv4 } = require('uuid');

async function makeCheckout(req, res) {
  let { cartId, name, address, phone, paymentMethod, saveInfo } = req.body;
  try {
    if (phone.startsWith('0')) {
      phone = '+880' + phone.slice(1);
    }

    if (!phone.startsWith('+880')) {
      phone = '+880' + phone;
    }

    let cartdata = await cartSchema
      .findOne({ cartId })
      .populate('items.productId');
    if (!cartdata) return res.status(404).json({ msg: 'Cart not Found' });

    cartdata.subTotal = cartdata.items.reduce(
      (acc, item) => acc + Number(item.singleSubtotal),
      0,
    );

    if (saveInfo) {
      await Save_info.findOneAndUpdate(
        { phone: phone },
        { name, address, phone: phone },
        { upsert: true, new: true },
      );
    }
    let oderId = `ODR-${uuidv4().split('-')[0].toUpperCase()}`;

    cartdata.totalPrice = cartdata.subTotal + cartdata.shippingCost;
    let checkout = new checkoutSchema({
      cartId,
      uniqueOrderID: oderId,
      items: cartdata.items,
      subTotal: cartdata.subTotal,
      shippingCost: cartdata.shippingCost,
      totalPrice: cartdata.totalPrice,
      name,
      address,
      phone: phone,
      paymentMethod,
    });
    await checkout.save();

    let updateProductSold = cartdata.items.map(item => ({
      updateOne: {
        filter: { _id: item.productId._id },
        update: { $inc: { sold: item.quantity } },
      },
    }));

    await productSchema.bulkWrite(updateProductSold);

    getIO().to(cartId).emit('checkout', {
      cartId: checkout.cartId,
      name: checkout.name,
      phone: checkout.phone,
      address: checkout.address,
      paymentMethod: checkout.paymentMethod,
      subTotal: checkout.subTotal,
      shippingCost: checkout.shippingCost,
      totalPrice: checkout.totalPrice,
      items: checkout.items,
      status: 'success',
    });

    await sendServerEvent(
      'Purchase',
      {
        phone: phone,
        ip: req.ip,
        ua: req.headers['user-agent'],
        event_id: checkout._id.toString(),

        custom_data: {
          currency: 'BDT',
          value: Number(checkout.totalPrice),
          contents: [
            {
              id: cartId,
              quantity: 1,
            },
          ],
          content_type: 'product',
        },
      },
      req,
    );

    await cartSchema.findOneAndDelete({ cartId });
    getIO().to(cartId).emit('deletedCart', { cartId });
    return res.status(200).json({
      msg: 'Checkout successful',
      data: checkout,
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

async function directCheckout(req, res) {
  let { productId, area } = req.query;
  let { name, address, phone, paymentMethod, saveInfo } = req.body;
  try {
    if (!productId || !name || !address || !phone) {
      return res.status(400).json({ msg: 'All fields are required ' });
    }

    if (phone.startsWith('0')) {
      phone = '+880' + phone.slice(1);
    }

    if (!phone.startsWith('+880')) {
      phone = '+880' + phone;
    }

    let product = await productSchema.findById(productId);

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    let subTotal = Number(product.price || 0);
    let weight = Number(product.weight || 0);
    let shippingCost = 0;

    if (weight > 0) {
      if (area === 'insideDhaka') {
        if (weight <= 1) shippingCost = 60;
        else if (weight <= 2) shippingCost = 80;
        else shippingCost = 100;
      } else if (area === 'outsideDhaka') {
        if (weight <= 1) shippingCost = 120;
        else if (weight <= 2) shippingCost = 150;
        else shippingCost = 200;
      }
    }

    let totalPrice = subTotal + shippingCost;
    let oderId = `ODR-${uuidv4().split('-')[0].toUpperCase()}`;
    if (saveInfo) {
      await Save_info.findOneAndUpdate(
        { phone: phone },
        { name, address, phone: phone },
        { upsert: true, new: true },
      );
    }

    let directCheckout = new checkoutSchema({
      uniqueOrderID: oderId,
      subTotal,
      shippingCost,
      totalPrice,
      name,
      address,
      phone: phone,
      paymentMethod,
      items: [
        {
          productId: productId,
          quantity: 1,
          product_secret: product.product_secret || '',
          price: product.price,
        },
      ],
    });

    await directCheckout.save();

    await productSchema.findByIdAndUpdate(productId, { $inc: { sold: 1 } });

    await sendServerEvent(
      'Purchase',
      {
        phone: phone,
        ip: req.ip,
        ua: req.headers['user-agent'],
        event_id: directCheckout._id.toString(),
        custom_data: {
          currency: 'BDT',
          value: Number(totalPrice),
          content_ids: [productId],
          content_type: 'product',
        },
      },
      req,
    );

    return res.status(200).json({
      msg: 'Checkout successful',
      data: directCheckout,
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

async function sendToSteadfast(req, res) {
  const { id } = req.params;
  try {
    const checkout = await checkoutSchema.findById(id);
    if (!checkout) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (checkout.steadfast?.trackingCode) {
      return res.status(400).json({
        msg: 'This order has already been sent to Steadfast',
        data: checkout.steadfast,
      });
    }

    const secret = checkout.items?.[0]?.product_secret;

    const steadfastResult = await createSteadfastOrder({
      invoice: secret || checkout.uniqueOrderID,
      recipientName: checkout.name,
      recipientPhone: checkout.phone,
      recipientAddress: checkout.address,
      codAmount:
        checkout.paymentMethod === 'cash on delivery' ? checkout.totalPrice : 0,
    });

    if (!steadfastResult.success) {
      checkout.steadfast = { error: steadfastResult.error };
      await checkout.save();
      return res.status(502).json({
        msg: 'Failed to send order to Steadfast',
        error: steadfastResult.error,
      });
    }

    checkout.steadfast = {
      invoiceSent: secret || checkout.uniqueOrderID,
      consignmentId: steadfastResult.data.consignment.consignment_id,
      trackingCode: steadfastResult.data.consignment.tracking_code,
      status: steadfastResult.data.consignment.status,
    };
    await checkout.save();

    getIO().emit('steadfastSent', {
      checkoutId: checkout._id,
      trackingCode: checkout.steadfast.trackingCode,
    });

    return res.status(200).json({
      msg: 'Order sent to Steadfast successfully',
      data: checkout.steadfast,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

async function steadfastWebhook(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const expectedToken = `Bearer ${process.env.STEADFAST_WEBHOOK_TOKEN}`;

    if (!authHeader || authHeader !== expectedToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized webhook request',
      });
    }

    const {
      notification_type,
      consignment_id,
      invoice,
      cod_amount,
      status,
      delivery_charge,
      tracking_message,
      updated_at,
    } = req.body;

    if (!invoice) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid consignment ID',
      });
    }

    let checkout = await checkoutSchema.findOne({
      'steadfast.invoiceSent': invoice,
    });

    if (!checkout) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found for this invoice',
      });
    }

    if (notification_type === 'delivery_status') {
      checkout.steadfast = {
        ...checkout.steadfast,
        consignmentId: consignment_id,
        status: status,
        trackingMessage: tracking_message,
        codAmount: cod_amount,
        deliveryCharge: delivery_charge,
        lastUpdatedAt: updated_at,
      };

      // চাইলে courier status অনুযায়ী orderStatus ও auto-update করা যায়
      if (status === 'cancelled') {
        checkout.orderStatus = 'Cancelled';
      } else if (status === 'delivered') {
        checkout.orderStatus = 'Delivered';
      } else if (status === 'out_for_delivery') {
        checkout.orderStatus = 'Shipped';
      } else if (status === 'returned') {
        checkout.orderStatus = 'Returned';
      }
    } else if (notification_type === 'tracking_update') {
      checkout.steadfast = {
        ...checkout.steadfast,
        consignmentId: consignment_id,
        trackingMessage: tracking_message,
        lastUpdatedAt: updated_at,
      };
    }

    await checkout.save();

    getIO().emit('steadfastUpdate', {
      checkoutId: checkout._id,
      invoice,
      notification_type,
      status: checkout.steadfast.status,
      trackingMessage: checkout.steadfast.trackingMessage,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Webhook received successfully.',
    });
  } catch (error) {
    console.error('Steadfast webhook error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function getSavedInfo(req, res) {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ msg: 'Phone number required' });

    const info = await Save_info.findOne({ phone: Number(phone) });

    if (!info)
      return res
        .status(404)
        .json({ msg: 'No saved info found for this number' });

    return res.status(200).json({ msg: 'Saved info found', data: info });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}

async function AdminReadCheckout(req, res) {
  try {
    const { orderStatus } = req.query;
    const filter = orderStatus ? { orderStatus } : {};

    let allCheckout = await checkoutSchema
      .find(filter)
      .populate('items.productId');

    if (!allCheckout) {
      return res.status(404).json({ msg: 'checkout not found !' });
    } else {
      return res.json({
        msg: 'all product found successfully !',
        data: allCheckout,
      });
    }
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res
      .status(500)
      .json({ msg: 'server error !', error: error.message });
  }
}

async function bulkUpdateOrderStatus(req, res) {
  const { ids, orderStatus } = req.body;

  const allowedStatus = [
    'Pending',
    'Confirmed',
    'Hold',
    'Cancelled',
    'Delivered',
    'Returned',
    'Shipped',
  ];

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ msg: 'ids array is required' });
  }

  if (!allowedStatus.includes(orderStatus)) {
    return res.status(400).json({ msg: 'Invalid order status' });
  }

  try {
    const result = await checkoutSchema.updateMany(
      { _id: { $in: ids } },
      { $set: { orderStatus } },
    );

    getIO().emit('bulkOrderStatusUpdate', {
      ids,
      orderStatus,
    });

    return res.status(200).json({
      msg: `${result.modifiedCount} orders updated to ${orderStatus}`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { orderStatus } = req.body;

  let allowedStatus = [
    'Pending',
    'Confirmed',
    'Hold',
    'Cancelled',
    'Delivered',
    'Returned',
    'Shipped',
  ];

  if (!allowedStatus.includes(orderStatus)) {
    return res.status(400).json({ msg: 'Invalid order status' });
  }

  try {
    const checkout = await checkoutSchema.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true },
    );

    if (!checkout) {
      return res.status(404).json({ msg: 'Checkout not found' });
    }

    getIO().to(checkout.cartId).emit('orderStatusUpdate', {
      checkoutId: checkout._id,
      orderStatus: checkout.orderStatus,
    });

    return res.status(200).json({
      msg: `Order status updated to ${orderStatus}`,
      data: checkout,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

async function deleteCheckout(req, res) {
  let { id } = req.query;
  try {
    let ids = Array.isArray(id) ? id : [id];

    if (!ids.length || !ids[0]) {
      return res.json({ msg: 'checkout not found' });
    }

    let result = await checkoutSchema.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.json({ msg: 'checkout not found' });
    }

    return res.json({
      msg: `${result.deletedCount} checkout deleted successfully`,
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res
      .status(500)
      .json({ msg: 'server error !', error: error.message });
  }
}

module.exports = {
  makeCheckout,
  AdminReadCheckout,
  deleteCheckout,
  getSavedInfo,
  directCheckout,
  bulkUpdateOrderStatus,
  updateOrderStatus,
  sendToSteadfast,
  steadfastWebhook,
};
