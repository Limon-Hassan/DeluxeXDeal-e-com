let mongoose = require('mongoose');

let productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      text: true,
    },
    description: {
      type: String,
      required: true,
      text: true,
    },
    price: {
      type: Number,
      required: true,
    },
    product_secret: [String],
    photo: [String],
    video: [String],
    sold: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'review',
      },
    ],
    Totalreviews: {
      type: Number,
      default: 0,
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
      },
    ],
    disCountPrice: {
      type: Number,
    },
    brand: {
      type: String,
    },
    oldPrice: {
      type: Number,
    },
    weight: {
      type: Number,
      default: 0,
    },
    Accessories: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);
productSchema.index({ name: 'text', description: 'text' });
module.exports = mongoose.model('product', productSchema);
