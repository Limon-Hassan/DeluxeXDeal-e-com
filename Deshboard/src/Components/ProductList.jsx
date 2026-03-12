import React from "react";
import {
  Input,
  Option,
  Select,
  Button,
  Dialog,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import JoditEditor from "jodit-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";

const ProductList = () => {
  const api = import.meta.env.VITE_SERVER_URL;
  const [GetallProducts, setGetallProducts] = useState([]);
  const editor = useRef(null);
  const dialogRef = useRef(null);
  const [productChangeName, setProductChangeName] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesFromBackend, setcategoriesFromBackend] = useState([]);
  const [brandChange, setBrandChange] = useState("");
  const [descriptionChange, setDescriptionChange] = useState("");
  const [priceChange, setPriceChange] = useState("");
  const [stockChange, setStockChange] = useState("");
  const [discountChange, setDiscountChange] = useState("");
  const [oldPriceChange, setOldPriceChange] = useState("");
  const [changeSold, setChangeSold] = useState("");
  const [Changeweight, setChangeweight] = useState("");
  const [images, setImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [proId, setProId] = useState(null);

  const handleOpen = (product) => {
    setOpen(true);
    setProId(product._id);
    setProductChangeName(product.name || "");
    setCategory(product.category?.[0]?._id || "");
    setBrandChange(product.brand || "");
    setPriceChange(product.price || "");
    setStockChange(product.stock || "");
    setDiscountChange(product.disCountPrice || "");
    setOldPriceChange(product.oldPrice || "");
    setChangeSold(product.sold || "");
    setChangeweight(product.weight || "");
    setDescriptionChange(product.description || "");
  };

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

  async function fetchProduct() {
    axios
      .get(`${api}api/v3/product/getAllProduct`, { withCredentials: true })
      .then((response) => {
        let data = response.data?.data || response.data || [];
        const safeArray = Array.isArray(data) ? data : [data];
        setGetallProducts(safeArray);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(() => {
    fetchProduct();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 4) {
      alert("You can only upload up to 4 images.");
      return;
    }

    setImages((prev) => [...prev, ...files]);
  };

  const handleDeleteImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

  const handleProDeleted = async (id) => {
    try {
      const res = await axios.delete(
        `${api}api/v3/product/deleteProduct?id=${id}`,
        { withCredentials: true },
      );

      setGetallProducts((prev) => prev.filter((item) => item._id !== id));

      setTimeout(() => {
        axios
          .get(`${api}api/v3/product/getProduct`)
          .then((res) => setGetallProducts(res.data));
      }, 1500);
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  useEffect(() => {
    if (open && dialogRef.current) {
      let timer = setTimeout(() => {
        dialogRef.current.scrollTop = 0;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const form = document.getElementById("addProductForm");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData();
    formData.append("ChangeName", productChangeName);
    formData.append("ChangeCategory", category);
    formData.append("ChangeBrand", brandChange);
    formData.append("Changestock", stockChange);
    formData.append("ChangeWeight", Changeweight);
    formData.append("ChangeOldPrice", oldPriceChange);
    formData.append("ChangeProductSold", changeSold);
    formData.append("ChangeDisCountPrice", discountChange);
    formData.append("ChangeDescription", descriptionChange);
    formData.append("ChangePrice", priceChange);
    if (images.length > 0) {
      images.forEach((img) => {
        formData.append("photo", img);
      });
    }
    for (let [key, value] of formData.entries()) {
      console.log(key + " : " + value);
    }

    try {
      const response = await axios.put(
        `${api}api/v3/product/updateProduct?id=${proId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );

      fetchProduct();
      setProductChangeName("");
      setCategory("");
      setBrandChange("");
      setPriceChange("");
      setStockChange("");
      setChangeweight("");
      setOldPriceChange("");
      setDescriptionChange("");
      setChangeSold("");
      setImages([]);
      toast.success("Product Update SuccessFully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        (error.response && error.response.data?.msg) || "Something went wrong",
        {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
        },
      );
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <section>
        <div className="sm:mx-0 sm:px-5 desktop:mx-auto desktop:max-w-[1400px] desktop:px-0">
          <div className="mt-8 w-full rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Products</h2>
              <div className="w-[450px] sm:hidden desktop:block">
                <Input color="blue" label="Search..." />
              </div>
              <Link
                to="/addproduct"
                className="rounded-lg border border-red-400 px-[42px] py-[12px] text-[20px] text-red-500 duration-300 ease-in-out hover:bg-red-500 hover:text-white sm:hidden desktop:block"
              >
                <span>+</span> Add Product
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 sm:px-2 desktop:px-0">Product</th>
                    <th className="py-2 sm:px-2 desktop:px-0">Price</th>
                    <th className="py-2 sm:px-2 desktop:px-0">Stock</th>
                    <th className="py-2 sm:px-2 desktop:px-0">Sold</th>
                    <th className="py-2 sm:px-2 desktop:px-0">Discount</th>
                    <th className="py-2 sm:px-2 desktop:px-0">Category</th>
                    <th className="py-2 sm:px-2 desktop:px-0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {GetallProducts.length > 0 ? (
                    GetallProducts?.map((product, index) => (
                      <>
                        <tr key={index} className="border-b">
                          <td className="flex items-center gap-2 py-[18px] sm:px-2 desktop:px-0">
                            <img
                              src={product.photo?.[0] || "/default-image.png"}
                              alt={product.name}
                              className="h-[70px] w-[70px] rounded-lg object-contain"
                            />
                            <p className="w-[360px] text-clip text-wrap">
                              {product.name}
                            </p>
                          </td>
                          <td className="px-0 py-[18px]">{product.price}৳</td>
                          <td className="px-0 py-[18px]">
                            {product.stock > 0 ? product.stock : "out of stock"}
                          </td>
                          <td className="px-0 py-[18px]">{product.sold}</td>
                          <td className="px-0 py-[18px]">
                            {product.disCountPrice || 0}%
                          </td>
                          <td className="px-0 py-[18px]">
                            {Array.isArray(product.category) &&
                            product.category.length > 0
                              ? product.category.map((cat, index) => (
                                  <span key={cat._id}>
                                    {cat.name}
                                    {index !== product.category.length - 1
                                      ? ", "
                                      : ""}
                                  </span>
                                ))
                              : "N/A"}
                          </td>
                          <div className="flex items-center gap-3 px-0 py-[18px]">
                            <Button
                              className="bg-transparent shadow-none hover:shadow-none"
                              onClick={() => handleOpen(product)}
                            >
                              <i className="fa-light fa-pen-line cursor-pointer text-[24px] text-green-400"></i>
                            </Button>
                            <i
                              onClick={() => handleProDeleted(product._id)}
                              className="fa-light fa-trash cursor-pointer text-[24px] text-red-400"
                            ></i>
                          </div>
                        </tr>
                      </>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-4 text-center text-gray-500"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Dialog
              size="sm"
              open={open}
              handler={() => setOpen(false)}
              className="z-[999] h-[690px] overflow-y-scroll p-4"
              ref={dialogRef}
            >
              <Typography variant="h4" className="mb-2" color="blue-gray">
                Edit Product
              </Typography>
              <IconButton
                size="sm"
                variant="text"
                className="!absolute right-3.5 top-3.5"
                onClick={() => setOpen(false)}
              >
                <XMarkIcon className="h-8 w-8 stroke-2" />
              </IconButton>
              <form noValidate id="addProductForm">
                <div className="flex flex-col gap-4">
                  <div>
                    <Typography variant="small" className="mb-3">
                      Product ChangeName *
                    </Typography>
                    <Input
                      color="blue"
                      type="text"
                      label="Product changeName"
                      value={productChangeName}
                      onChange={(e) => setProductChangeName(e.target.value)}
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
                      Brand Change *
                    </Typography>
                    <Input
                      color="blue"
                      type="text"
                      label="Product Brand Change"
                      value={brandChange}
                      onChange={(e) => setBrandChange(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-3">
                      Change Price *
                    </Typography>
                    <Input
                      color="blue"
                      label="Change Price"
                      value={priceChange}
                      onChange={(e) => setPriceChange(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-3">
                      Change Discount
                    </Typography>
                    <Input
                      color="blue"
                      label="Change Discount"
                      value={discountChange}
                      placeholder="Exm: 10 - not required"
                      onChange={(e) => setDiscountChange(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-3">
                      Change stock *
                    </Typography>
                    <Input
                      color="blue"
                      label="Change stock"
                      value={stockChange}
                      onChange={(e) => setStockChange(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-3">
                      Change weight
                    </Typography>
                    <Input
                      color="blue"
                      label="Change weight"
                      value={Changeweight}
                      placeholder="Exm: 2.5 - not required"
                      onChange={(e) => setChangeweight(e.target.value)}
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-3">
                      Old-Price
                    </Typography>
                    <Input
                      color="blue"
                      label="Old-Price"
                      placeholder="not required"
                      value={oldPriceChange}
                      onChange={(e) => setOldPriceChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-3">
                      Sold
                    </Typography>
                    <Input
                      color="blue"
                      label="sold"
                      placeholder="not required"
                      value={changeSold}
                      onChange={(e) => setChangeSold(e.target.value)}
                    />
                  </div>
                  <div className="w-full">
                    <Typography variant="small" className="mb-3">
                      Change Description *
                    </Typography>
                    <div className="w-full resize-none rounded border border-gray-300 bg-[#F5F5F5] p-2 text-[16px] font-normal text-black/50 outline-none sm:h-[550px] desktop:h-[400px]">
                      <JoditEditor
                        ref={editor}
                        value={descriptionChange}
                        config={config}
                        tabIndex={1}
                        onChange={(newContent) =>
                          setDescriptionChange(newContent)
                        }
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
                      htmlFor="dropzone-file"
                      className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        <i className="fa-light fa-cloud-arrow-up mb-3 text-[30px] text-blue-600"></i>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SVG, PNG, JPG or GIF (MAX. 768x768px)
                        </p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        accept="image/*"
                        multiple
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

                <div className="mt-6 flex gap-4">
                  <Button type="button" color="blue" onClick={handleAddProduct}>
                    Add Product
                  </Button>
                  <Button onClick={() => setOpen(false)} color="red">
                    Cancel
                  </Button>
                </div>
                <ToastContainer />
              </form>
            </Dialog>
            <div className="mb-5 mt-8 flex items-center justify-between text-sm text-gray-600">
              <p>Showing {GetallProducts.length} entries</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductList;
