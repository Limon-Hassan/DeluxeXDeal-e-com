const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true,
  },
  product_secret: {
    type: String,
  },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  weight: { type: Number, default: 1 }, 
  singleSubtotal: { type: Number, default: 0 }, 
  shippingCost: { type: Number, default: 0 }, 
});

const cartSchema = new mongoose.Schema(
  {
    cartId: { type: String, required: true },
    items: [cartItemSchema],
    subTotal: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
