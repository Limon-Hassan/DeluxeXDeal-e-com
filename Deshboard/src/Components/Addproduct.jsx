import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  Input,
  Select,
  Option,
  Button,
  Typography,
} from "@material-tailwind/react";
import JoditEditor from "jodit-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const AddProduct = () => {
  const api = import.meta.env.VITE_SERVER_URL;
  const editor = useRef(null);
  const [productName, setProductName] = useState("");
  const [productSecretKey, setProductSecretKey] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesFromBackend, setcategoriesFromBackend] = useState([]);
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [discount, setDiscount] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [sold, setSold] = useState("");
  const [weight, setWeight] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Write your content here...",
      height: 400,
      autofocus: true,
      toolbarAdaptive: false,
      toolbarSticky: false,
    }),
    [],
  );

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 4) {
      alert("You can only upload up to 4 images.");
      return;
    }

    setImages((prev) => [...prev, ...files]);
  };

  let handleVideoChange = (e) => {
    let videoFiles = Array.from(e.target.files);
    if (videoFiles.length + videos.length > 2) {
      alert("You can only upload up to 2 videos.");
      return;
    }
    setVideos((prev) => [...prev, ...videoFiles]);
  };

  const handleDeleteImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    axios
      .get(`${api}api/v3/category/getCategory`, { withCredentials: true })
      .then((response) => {
        let data = response.data?.data || response.data || [];
        const safeArray = Array.isArray(data) ? data : [data];
        setcategoriesFromBackend(safeArray);
      })
      .catch((error) => {
        console.error("Error fetching categoriesFromBackend:", error);
      });
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const form = document.getElementById("addProductForm");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const formData = new FormData();
    formData.append("name", productName);
    formData.append("product_secret", productSecretKey);
    formData.append("category", category);
    formData.append("brand", brand);
    formData.append("stock", stock);
    formData.append("weight", weight);
    formData.append("oldPrice", oldPrice);
    formData.append("sold", sold);
    formData.append("disCountPrice", discount);
    formData.append("description", description);
    formData.append("price", price);
    if (images.length > 0) {
      images.forEach((img) => {
        formData.append("photo", img);
      });
    }
    if (videos.length > 0) {
      videos.forEach((video) => {
        formData.append("video", video);
      });
    }
    for (let [key, value] of formData.entries()) {
      console.log(key + " : " + value);
    }
    await axios
      .post(`${api}api/v3/product/AddProduct`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      })
      .then((response) => {
        console.log(response);
        setProductName("");
        setCategory("");
        setBrand("");
        setDescription("");
        setPrice("");
        setStock("");
        setWeight("");
        setOldPrice("");
        setSold("");
        setDiscount("");
        setProductSecretKey("");
        setImages([]);
        setVideos([]);
        toast.success("Product added SuccessFully!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          draggable: true,
          progress: undefined,
        });
      })
      .catch((error) => {
        if (error.response && error.response.data) {
          toast.error(error.response.data.msg || "Something went wrong", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            draggable: true,
          });
        }
      });
  };

  return (
    <Card className="mx-auto w-full max-w-5xl p-6 shadow-lg">
      <Typography variant="h4" className="mb-4 text-lg">
        Add Product
      </Typography>
      <form noValidate id="addProductForm">
        <div className="flex flex-col gap-4">
          <div>
            <Typography variant="small" className="mb-3">
              Product Name *
            </Typography>
            <Input
              color="blue"
              type="text"
              label="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              maxLength={80}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Product Secret Key
            </Typography>
            <Input
              color="blue"
              type="text"
              label="Product Secret Key"
              value={productSecretKey}
              onChange={(e) => setProductSecretKey(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Category *
            </Typography>
            <Select
              value={category}
              onChange={(value) => {
                setCategory(value);
              }}
              required
            >
              {categoriesFromBackend.length > 0 ? (
                categoriesFromBackend.map((cat) => (
                  <Option key={cat._id} value={cat._id}>
                    {cat.name}
                  </Option>
                ))
              ) : (
                <Option disabled>No Categories Found</Option>
              )}
            </Select>
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Brand *
            </Typography>
            <Input
              color="blue"
              type="text"
              label="Product Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              maxLength={50}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Price *
            </Typography>
            <Input
              color="blue"
              type="number"
              label="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="1"
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Discount Percentage
            </Typography>
            <Input
              color="blue"
              type="number"
              label="Discount"
              value={discount}
              placeholder="Exm: 10 - not required"
              onChange={(e) => setDiscount(e.target.value)}
              min="1"
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              stock *
            </Typography>
            <Input
              color="blue"
              type="number"
              label="stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              min="1"
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Product weight
            </Typography>
            <Input
              color="blue"
              type="number"
              label="weight"
              value={weight}
              placeholder="Exm: 2.5 - not required"
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Old-Price
            </Typography>
            <Input
              color="blue"
              type="number"
              label="Old-Price"
              placeholder="not required"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-3">
              Sold
            </Typography>
            <Input
              color="blue"
              type="number"
              label="Product Sold"
              placeholder="not required"
              value={sold}
              onChange={(e) => setSold(e.target.value)}
            />
          </div>
          <div className="w-full">
            <Typography variant="small" className="mb-3">
              Description *
            </Typography>
            <div className="h-[400px] w-full resize-none rounded border border-gray-300 bg-[#F5F5F5] p-2 text-[16px] font-normal text-black/50 outline-none">
              <JoditEditor
                ref={editor}
                value={description}
                config={config}
                tabIndex={1}
                required
                onBlur={(newContent) => setDescription(newContent)}
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Typography variant="small" className="mb-3">
            Upload Images
          </Typography>

          <div className="flex w-full flex-col items-center justify-center gap-4">
            <label
              htmlFor="images-dropzone-file"
              className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <i className="fa-light fa-cloud-arrow-up mb-3 text-[30px] text-blue-600"></i>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  SVG, PNG, JPG or GIF (MAX. 768x768px)
                </p>
              </div>
              <input
                id="images-dropzone-file"
                type="file"
                accept="image/*"
                multiple
                required
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative h-40 w-40">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`upload-${index}`}
                    className="h-full w-full rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Typography variant="small" className="mb-3">
            Upload Video
          </Typography>

          <div className="flex w-full flex-col items-center justify-center gap-4">
            <label
              htmlFor="videos-dropzone-file"
              className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <i className="fa-light fa-cloud-arrow-up mb-3 text-[30px] text-blue-600"></i>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  SVG, PNG, JPG or GIF (MAX. 768x768px)
                </p>
              </div>
              <input
                id="videos-dropzone-file"
                type="file"
                accept="video/*"
                multiple
                required
                onChange={handleVideoChange}
                className="hidden"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-4">
              {videos.map((video, index) => (
                <div key={index} className="relative h-40 w-40">
                  <video
                    src={URL.createObjectURL(video)}
                    alt={`upload-${index}`}
                    className="h-full w-full rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <Button className="w-full" color="blue" onClick={handleAddProduct}>
            Add Product
          </Button>
        </div>
        <ToastContainer />
      </form>
    </Card>
  );
};

export default AddProduct;
