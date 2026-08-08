let mongoose = require('mongoose');

let CheckoutSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },
        singleSubtotal: {
          type: Number,
        },
        product_secret: { type: String },
      },
    ],
    subTotal: {
      type: Number,
    },
    shippingCost: Number,
    totalPrice: Number,
    disCountPrice: Number,
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    uniqueOrderID: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: 'cash on delivery',
    },
    steadfast: {
      consignmentId: Number,
      trackingCode: String,
      status: String,
      trackingMessage: String,
      codAmount: Number,
      deliveryCharge: Number,
      lastUpdatedAt: Date,
      error: String,
    },
    orderStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Hold',
        'Cancelled',
        'Delivered',
        'Returned',
        'Shipped',
      ],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('checkout', CheckoutSchema);
