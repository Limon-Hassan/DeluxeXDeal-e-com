const categorySchema = require('../models/categorySchema');
const productSchema = require('../models/productSchema');
let { getIO } = require('../socket_server');
let path = require('path');
let fs = require('fs');

async function createProduct(req, res) {
  let {
    name,
    description,
    price,
    category,
    stock,
    brand,
    weight,
    oldPrice,
    disCountPrice,
    product_secret,
  } = req.body;
  if (!name || !description || !price) {
    return res.status(400).send({ msg: 'please fill all the fields' });
  }
  try {
    let photoNames = [];
    if (req.files?.photo) {
      req.files.photo.forEach(file =>
        photoNames.push(process.env.HOST_NAME + file.filename),
      );
    }

    let videoNames = [];
    if (req.files?.video) {
      req.files.video.forEach(file =>
        videoNames.push(process.env.HOST_NAME + file.filename),
      );
    }

    let product = new productSchema({
      name,
      description,
      price,
      photo: photoNames,
      video: videoNames,
      category,
      stock,
      brand,
      weight,
      oldPrice,
      disCountPrice,
      product_secret: product_secret || '',
    });

    await product.save();

    if (category && category.length > 0) {
      await categorySchema.updateMany(
        { _id: { $in: category } },
        { $push: { Product: product._id } },
      );
    }
    getIO().emit('productCreated', product);
    return res
      .status(200)
      .send({ msg: 'product added successfully', data: product });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'server error', error: error.message });
  }
}

async function getProduct(req, res) {
  let { id, page = 1, limit = 20 } = req.query;
  try {
    if (id) {
      let singleProduct = await productSchema
        .findById(id)
        .populate('category')
        .populate('reviews', 'name comment rating');

      if (!singleProduct) {
        return res.status(404).json({ msg: 'Product not found' });
      }

      let totalReview = singleProduct.reviews.length;
      const relatedProduct = await productSchema
        .find({
          category: singleProduct.category._id || singleProduct.category,
          _id: { $ne: id },
        })
        .select('-video')
        .limit(8)
        .populate({
          path: 'category',
          select: 'name description image',
        });
      return res.json({
        product: {
          ...singleProduct.toObject(),
          Totalreviews: totalReview,
        },
        relatedProduct,
      });
    } else {
      let skip = (page - 1) * limit;
      let product = await productSchema
        .find()
        .select('-video')
        .skip(skip)
        .limit(Number(limit))
        .populate('category');
      return res.json(product);
    }
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'error', error: error.message });
  }
}

async function getAllProduct(req, res) {
  try {
    let product = await productSchema
      .find()
      .select('-video')
      .populate('category');
    return res.json(product);
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'error', error: error.message });
  }
}

async function topProduct(req, res) {
  try {
    let topProduct = await productSchema
      .find({ sold: { $gt: 0 } })
      .select('-video')
      .sort({ sold: -1 })
      .limit(12)
      .populate({ path: 'category', select: 'name description image' });

    getIO().emit('topProduct', topProduct);
    return res.json({
      success: true,
      topProduct,
    });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
  }
}

async function updateProduct(req, res) {
  let { id } = req.query;
  let {
    ChangeName,
    ChangeDescription,
    ChangePrice,
    ChangeCategory,
    Changestock,
    ChangeBrand,
    ChangeWeight,
    ChangeOldPrice,
    ChangeProductSold,
    ChangeDisCountPrice,
    ChangeProduct_secret,
  } = req.body;
  try {
    let updatedData = {};
    if (ChangeName !== undefined && ChangeName !== '')
      updatedData.name = ChangeName;
    if (ChangeDescription !== undefined && ChangeDescription !== '')
      updatedData.description = ChangeDescription;
    if (ChangePrice !== undefined && ChangePrice !== '')
      updatedData.price = Number(ChangePrice);
    if (Changestock !== undefined && Changestock !== '')
      updatedData.stock = Number(Changestock);
    if (ChangeBrand) updatedData.brand = ChangeBrand;
    if (ChangeWeight !== undefined && ChangeWeight !== '')
      updatedData.weight = Number(ChangeWeight);
    if (ChangeProduct_secret !== undefined && ChangeProduct_secret !== '')
      updatedData.product_secret = ChangeProduct_secret;
    if (ChangeOldPrice !== undefined && ChangeOldPrice !== '')
      updatedData.oldPrice = Number(ChangeOldPrice);
    if (ChangeDisCountPrice !== undefined && ChangeDisCountPrice !== '')
      updatedData.disCountPrice = Number(ChangeDisCountPrice);
    if (ChangeProductSold !== undefined && ChangeProductSold !== '')
      updatedData.sold = Number(ChangeProductSold);

    if (ChangeCategory) {
      updatedData.category = Array.isArray(ChangeCategory)
        ? ChangeCategory
        : [ChangeCategory];
    }

    if (req.files?.photo && req.files.photo.length > 0) {
      updatedData.photo = req.files.photo.map(
        file => process.env.HOST_NAME + file.filename,
      );
    }

    if (req.files?.video && req.files.video.length > 0) {
      updatedData.video = req.files.video.map(
        file => process.env.HOST_NAME + file.filename,
      );
    }

    let updatedProduct = await productSchema.findByIdAndUpdate(
      { _id: id },
      { $set: updatedData },
      { new: true },
    );

    if (!updatedProduct) {
      return res.json({ msg: 'product Not found !' });
    }

    getIO().emit('productUpdated', updatedProduct);
    return res.json({
      msg: 'Product update Successfully !',
      data: updatedProduct,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ msg: error.message });
  }
}

async function deleteProduct(req, res) {
  let { id } = req.query;
  try {
    let deleteProduct = await productSchema.findById(id);
    if (!deleteProduct) {
      return res.json({ msg: 'product Not found !' });
    }
    await deleteProduct.deleteOne();

    const unlinkFile = (fileUrl, folderName) => {
      return new Promise(resolve => {
        const filePath = path.join(
          __dirname,
          `../${folderName}`,
          fileUrl.split('/').pop(),
        );
        fs.unlink(filePath, err => {
          if (err) console.log('file delete failed:', err.message);
          resolve();
        });
      });
    };

    const deletePromises = [
      ...deleteProduct.photo.map(p => unlinkFile(p, 'productImage')),
      ...(deleteProduct.video || []).map(v => unlinkFile(v, 'productVideo')),
    ];

    await Promise.all(deletePromises);
    getIO().emit('productDeleted', id);
    return res.json({ msg: 'Product delete successfully !', id });
  } catch (error) {
    console.log(error.message);
    console.error(error.message);
    return res.status(500).json({ msg: 'server error', error: error.message });
  }
}

module.exports = {
  createProduct,
  getProduct,
  topProduct,
  updateProduct,
  getAllProduct,
  deleteProduct,
};
