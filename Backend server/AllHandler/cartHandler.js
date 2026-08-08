const cartSchema = require('../models/cartSchema');
const productSchema = require('../models/productSchema');
const { getIO } = require('../socket_server');

async function addCart(req, res) {
  let { cartId, productId } = req.body;

  try {
    const product = await productSchema.findById(productId);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    let cart = await cartSchema.findOne({ cartId });
    if (!cart) {
      cart = new cartSchema({
        cartId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId,
    );
    if (existingItem)
      return res
        .status(400)
        .json({ msg: 'This product is already in your cart' });

    const qty = 1;
    const price = Number(product.price) || 0;
    const weight = Number(product.weight) || 1;

    const shippingCost = 0;

    cart.items.push({
      productId,
      quantity: qty,
      price,
      weight,
      product_secret: product.product_secret || '',
      singleSubtotal: price * qty,
      shippingCost,
    });

    cart.subTotal = cart.items.reduce(
      (acc, item) => acc + Number(item.singleSubtotal),
      0,
    );

    cart.totalPrice = cart.subTotal;

    await cart.save();
    getIO().to(cartId).emit('Add cart', { cart });
    return res.status(200).json({ msg: 'Product added to cart!', data: cart });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: String(error) });
  }
}

async function readCart(req, res) {
  let { cartId } = req.query;
  try {
    let getCart = await cartSchema
      .findOne({ cartId })
      .populate('items.productId');

    if (!getCart) {
      return res.status(404).json({ msg: 'cart not found !' });
    }
    let item = getCart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      singleSubtotal: item.price * item.quantity,
    }));
    let subTotal = item.reduce(
      (acc, item) => acc + Number(item.singleSubtotal),
      0,
    );
    getIO()
      .to(cartId)
      .emit('cartFetched', { cartId, items: getCart.items, subTotal });
    getIO().to(cartId).emit('cartFetched', {
      cartId,
      items: getCart.items,
      subTotal: getCart.subTotal,
    });
    return res.status(200).json({
      msg: 'Cart fetched successfully',
      data: {
        cartId: getCart.cartId,
        items: getCart.items,
        subTotal,
      },
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'server error', error: error.message });
  }
}

async function cartSummary(req, res) {
  try {
    const { cartId, area } = req.query;

    const cart = await cartSchema
      .findOne({ cartId })
      .populate('items.productId');

    if (!cart) {
      return res.status(404).json({ msg: 'Cart not found' });
    }
    if (!area) return res.status(400).json({ msg: 'Please Select An Area' });

    cart.items = cart.items.map(item => {
      const price = Number(item.productId.price) || 0;
      item.singleSubtotal = price * item.quantity;
      return item;
    });

    let shippingCost = 0;
    if (area === 'insideDhaka') {
      shippingCost = 80;
    } else if (area === 'outsideDhaka') {
      shippingCost = 150;
    }

    cart.shippingCost = shippingCost;

    cart.subTotal = cart.items.reduce(
      (acc, item) => acc + item.singleSubtotal,
      0,
    );

    cart.totalPrice = cart.subTotal + cart.shippingCost;
    await cart.save();
    getIO().to(cartId).emit('cartSummery', {
      cartId: cart.cartId,
      subTotal: cart.subTotal,
      shippingCost: cart.shippingCost,
      totalPrice: cart.totalPrice,
      items: cart.items,
    });
    return res.status(200).json({
      msg: 'Cart summary fetched successfully',
      data: {
        cartId: cart.cartId,
        subTotal: cart.subTotal,
        shippingCost: cart.shippingCost,
        totalPrice: cart.totalPrice,
        items: cart.items,
      },
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: String(error) });
  }
}

async function FinalSummery(req, res) {
  let { CartId } = req.query;
  try {
    let cartSummary = await cartSchema
      .findOne({ cartId: CartId })
      .populate('items.productId');

    if (!cartSummary) {
      return res.status(404).json({ msg: 'Cart not found' });
    }
    return res.status(200).json({
      msg: 'Final summary fetched successfully',
      data: {
        cartId: cartSummary.cartId,
        subTotal: cartSummary.subTotal,
        shippingCost: cartSummary.shippingCost,
        totalPrice: cartSummary.totalPrice,
        items: cartSummary.items,
      },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: String(error) });
  }
}

async function IncrementCart(req, res) {
  let { cartId, action, productId } = req.query;
  try {
    let cartItems = await cartSchema
      .findOne({ cartId })
      .populate('items.productId');

    if (!cartItems) {
      return res.status(404).json({ msg: 'cart not found!' });
    }
    let item = cartItems.items.find(
      i => i.productId._id.toString() === productId,
    );
    if (!item)
      return res.status(404).json({ msg: 'Product not found in cart' });

    if (action === 'Increment') {
      if (item.quantity >= 30)
        return res.status(400).json({ msg: 'Max quantity reached' });
      if (item.productId.stock <= item.quantity)
        return res.status(400).json({ msg: 'Not enough stock' });
      item.quantity += 1;
    } else if (action === 'Decrement') {
      if (item.quantity <= 1)
        return res.status(400).json({ msg: 'Quantity cannot go below 1' });
      item.quantity -= 1;
    } else {
      return res.status(400).json({ msg: 'Invalid action' });
    }

    cartItems.items = cartItems.items.map(item => {
      item.singleSubtotal = item.price * item.quantity;
      return item;
    });

    cartItems.subTotal = cartItems.items.reduce(
      (acc, item) => acc + item.singleSubtotal,
      0,
    );

    cartItems.totalPrice = cartItems.subTotal;
    await cartItems.save();
    getIO().to(cartId).emit('IncrementCart', { cartItems });
    return res.status(200).json({
      msg: `Cart ${
        action === 'Increment' ? 'Incremented' : 'Decremented'
      } successfully`,
      data: cartItems,
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

async function deleteSingleCartItem(req, res) {
  const { cartId, productId } = req.query;

  try {
    const cart = await cartSchema.findOne({ cartId });
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId,
    );

    if (cart.items.length === 0) {
      await cartSchema.findOneAndDelete({ cartId });
      getIO().to(cartId).emit('deletedcart', { cartId });
      return res.status(200).json({ msg: 'Cart deleted successfully!' });
    }

    cart.subTotal = cart.items.reduce(
      (acc, item) => acc + Number(item.singleSubtotal),
      0,
    );
    cart.totalPrice = cart.subTotal;

    await cart.save();

    getIO()
      .to(cartId)
      .emit('itemDeleted', { cartId, productId, updatedCart: cart });

    return res.status(200).json({
      msg: 'Item deleted successfully!',
      data: cart,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
}

module.exports = {
  addCart,
  readCart,
  cartSummary,
  IncrementCart,
  FinalSummery,
  deleteSingleCartItem,
};
