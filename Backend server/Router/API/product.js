let express = require('express');
let router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createProduct,
  getProduct,
  topProduct,
  updateProduct,
  deleteProduct,
  getAllProduct,
} = require('../../AllHandler/productHandler');
const { makeReviews, getReviews } = require('../../AllHandler/reviewHandler');
const { searchProduct } = require('../../AllHandler/searchHandler');

// video ফোল্ডার না থাকলে automatically বানিয়ে নিবে
if (!fs.existsSync('./productVideo')) {
  fs.mkdirSync('./productVideo');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video') {
      cb(null, './productVideo');
    } else {
      cb(null, './productImage');
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let extencion = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueName + extencion);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
    return cb(new Error('Only video files are allowed for video field'));
  }
  if (file.fieldname === 'photo' && !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed for photo field'));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB (video এর জন্য বেশি লাগবে)
});

router.post(
  '/AddProduct',
  upload.fields([
    { name: 'photo', maxCount: 4 },
    { name: 'video', maxCount: 2 },
  ]),
  createProduct,
);
router.get('/getProduct', getProduct);
router.get('/getAllProduct', getAllProduct);
router.get('/product/searchProduct', searchProduct);
router.post('/CreateReviews', makeReviews);
router.get('/getReviews', getReviews);
router.get('/topProduct', topProduct);
router.put(
  '/updateProduct',
  upload.fields([
    { name: 'photo', maxCount: 4 },
    { name: 'video', maxCount: 2 },
  ]),
  updateProduct,
);
router.delete('/deleteProduct', deleteProduct);

module.exports = router;
