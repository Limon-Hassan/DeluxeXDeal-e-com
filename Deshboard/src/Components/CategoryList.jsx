import { Input } from "@material-tailwind/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

const CategoryList = () => {
  const api = import.meta.env.VITE_SERVER_URL;
  let [GetallCategories, setGetallCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${api}api/v3/category/getCategory`);
        console.log(response.data);
        let data = response.data?.data || response.data || [];
        const safeArray = Array.isArray(data) ? data : [data];
        setGetallCategories(safeArray);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleCateDeleted = async (id) => {
    try {
      const res = await axios.delete(
        `${api}api/v3/category/deleteCategory?id=${id}`,
        { withCredentials: true },
      );

      setGetallCategories((prev) => prev.filter((item) => item._id !== id));

      console.log(res.data);

      setTimeout(() => {
        axios
          .get(`${api}api/v3/category/getCategory`)
          .then((res) => setGetallCategories(res.data));
      }, 1500);
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  return (
    <>
      <section>
        <div className="sm:mx-0 sm:px-5 desktop:mx-auto desktop:max-w-[1400px] desktop:px-0">
          <div className="mt-8 w-full rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Categories</h2>
              <div className="w-[450px] sm:hidden desktop:block">
                <Input
                  color="blue"
                  label="Search..."
                  className="placeholder:font-Oi_kiree"
                />
              </div>
              <Link
                to="/addcategory"
                className="rounded-lg border border-red-400 px-[42px] py-[12px] text-[20px] text-red-500 duration-300 ease-in-out hover:bg-red-500 hover:text-white sm:hidden desktop:block"
              >
                <span>+</span> Add category
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2">Categorys</th>
                    <th className="px-4 py-2">Category ID</th>
                    <th className="px-4 py-2">In Products</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {GetallCategories.length > 0 ? (
                    GetallCategories?.map((category) => (
                      <tr key={category._id} className="border-b">
                        <td className="flex items-center gap-[20px] px-4 py-3">
                          <img
                            src={category.image?.[0] || "/mans.png"}
                            alt={category.name}
                            className="h-10 w-10 rounded-lg"
                          />
                          {category.name}
                        </td>
                        <td className="px-4 py-3">{category._id}</td>
                        <td className="px-4 py-3">
                          itmes({category.totalproducts || "N/A"})
                        </td>
                        <td className="px-4 py-3">
                          <FaTrash
                            onClick={() => handleCateDeleted(category._id)}
                            className="cursor-pointer text-red-500"
                          />
                        </td>
                      </tr>
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
            <div className="mb-5 mt-8 flex items-center justify-between text-sm text-gray-600">
              <p>Showing {GetallCategories.length} entries</p>
              <p>Page 1 of 1</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CategoryList;
