import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Rootleayout from "./Components/Rootleayout";
import Home from "./Pages/Home";
import Addproduct from "./Components/Addproduct";
import ProductList from "./Components/ProductList";
import AddCategory from "./Components/AddCategory";
import CategoryList from "./Components/CategoryList";
import Account from "./Components/Account";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Orderlist from "./Components/Orderlist";
import OrderDetails from "./Components/OrderDetails";
import OrderDetailsBase2 from "./Components/OrderDetailsBase2";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Rootleayout />}>
          <Route index element={<Home />} />
          <Route path="/addproduct" element={<Addproduct />} />
          <Route path="/addcategory" element={<AddCategory />} />
          <Route path="/productlist" element={<ProductList />} />
          <Route path="/CategoryList" element={<CategoryList />} />
          <Route path="/Account" element={<Account />} />
          <Route path="/orderlist" element={<Orderlist />} />
          <Route path="/orderDetails" element={<OrderDetails />} />
          <Route path="/orderDetailsBase2" element={<OrderDetailsBase2 />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
