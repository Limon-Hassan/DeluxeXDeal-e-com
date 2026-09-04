'use client';

import React, { useEffect, useRef, useState } from 'react';
import Container from '../../Componets/Container/Container';
import { FaCartShopping } from 'react-icons/fa6';
import { FaChevronDown } from 'react-icons/fa';
import Pagination from '../../Componets/Pagination';
import socket from '../../utills/socket';
import { useSearchParams } from 'next/navigation';
import { FaBars } from 'react-icons/fa6';
import { ImCross } from 'react-icons/im';

const ClientShop = () => {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  let [minPrice, SetminPrice] = useState(0);
  let [maxPrice, SetmaxPrice] = useState(0);
  const [sortOrder, setSortOrder] = useState('');
  let [CurrentPrice, SetCurrentPrice] = useState(maxPrice);
  let [filteredRange, setFilteredRange] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ActiveSidebar, setActiveSidebar] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function FetchProduct() {
    try {
      const params = new URLSearchParams();

      if (query) params.append('query', query);
      if (filteredRange) {
        params.append('minPrice', filteredRange.min);
        params.append('maxPrice', filteredRange.max);
      }
      if (sortOrder) params.append('sort', sortOrder);
      params.append('page', currentPage);
      params.append('limit', 12);

      const url = `${
        process.env.NEXT_PUBLIC_SERVER_PORT
      }api/v3/product/product/searchProduct?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const allProducts =
        currentPage === 1
          ? [...data.mainProducts, ...data.related]
          : [...data.mainProducts];

      setProducts(allProducts || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      const highest = Math.max(...prices);
      SetmaxPrice(highest);
      SetCurrentPrice(highest);
    }
  }, [products]);

  useEffect(() => {
    FetchProduct();
  }, [query, filteredRange, sortOrder, currentPage]);

  useEffect(() => {
    socket.on('productCreated', newProduct => {
      setProducts(prev => [...prev, newProduct]);
    });
    return () => socket.off('productCreated');
  }, []);

  let handleRangeChange = e => {
    const value = Number(e.target.value);
    SetCurrentPrice(value);
    SetmaxPrice(value);
  };

  let handleFilter = () => {
    setFilteredRange({ min: minPrice, max: maxPrice });
    setActiveSidebar(false);
  };

  let handleShowProduct = async product => {
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/getProduct?id=${product}`,
      );

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      const slug = data.product.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      window.location.href = `/productDetails/${data.product._id}/${slug}`;
    } catch (error) {
      console.log(error);
    }
  };

  let handleDirectCheckout = async proID => {
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/getProduct?id=${proID}`,
      );

      if (!response.ok) throw new Error('Failed to fetch product');
      let data = await response.json();
      window.location.href = `/checkout/${
        data.product._id
      }/${data.product.name.replace(/\s+/g, '-')}`;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="relative z-0 mobile:pt-[150px] mobile:pb-[50px] computer:pt-[200px] computer:pb-[200px] bg-[#E6963A]/30">
      <Container>
        <div
          className="flex justify-between mobile:mt-0 laptop:mt-[60px] computer:mt-[60px] "
          ref={menuRef}
        >
          <button
            onClick={() => setActiveSidebar(!ActiveSidebar)}
            className={`laptop:hidden computer:hidden absolute top-[10px] left-0 z-[99] text-white bg-[#E6963A] text-[20px] rounded-full w-[50px] h-[50px] flex justify-center items-center transition-all duration-500 ease-in-out ${
              ActiveSidebar
                ? 'opacity-100 rotate-90 left-0'
                : 'opacity-50 rotate-0 top-[-20px] left-[-30px]'
            }`}
          >
            {ActiveSidebar ? <ImCross /> : <FaBars />}
          </button>
          {ActiveSidebar === true ? (
            <div
              className={`w-full computer:block laptop:block bg-white absolute top-[10px] left-0 z-50 p-[10px] rounded-[6px]`}
            >
              <div className="mb-[20px] border border-[#e2e2e2] rounded-[8px]">
                <h5 className="text-[20px] font-nunito font-bold text-[#2C3C28] border-b border-[#e2e2e2] py-[30px] pl-[30px] ">
                  Widget Price Filter
                </h5>
                <div className="flex justify-between gap-3 px-[20px] pt-[30px] pb-[15px]">
                  <div className="flex-1">
                    <label className="block text-sm text-[#6E777D] mb-1">
                      Min price
                    </label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={e => SetminPrice(Number(e.target.value))}
                      className="w-full border border-[#e2e2e2] rounded-[4px] px-[15px] py-1.5 outline-none font-medium text-[#2C3C28]"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm text-[#6E777D] mb-1">
                      Max price
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={e => SetmaxPrice(Number(e.target.value))}
                      className="w-full border border-[#e2e2e2] rounded-[4px] px-[15px] py-1.5 outline-none font-medium text-[#2C3C28]"
                    />
                  </div>
                </div>
                <div className="px-[20px] mb-[30px]">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={CurrentPrice}
                    onChange={handleRangeChange}
                    className="w-full h-2 bg-[#E6963A] rounded-lg appearance-none cursor-pointer accent-[#E6963A]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="mt-3 text-[16px] font-nunito font-normal text-[#6E777D]">
                      Price: ${minPrice} — ${maxPrice}
                    </p>

                    <button
                      onClick={handleFilter}
                      className="mt-3 bg-[#E6963A] text-white font-semibold py-2 px-4 rounded-md cursor-pointer"
                    >
                      Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[260px] mobile:hidden tablet:hidden computer:block laptop:block">
              <div className="mb-[20px] border border-[#e2e2e2] rounded-[8px]">
                <h5 className="text-[20px] font-nunito font-bold text-[#2C3C28] border-b border-[#e2e2e2] py-[30px] pl-[30px] pr-[20px]">
                  Widget Price Filter
                </h5>
                <div className="flex justify-between gap-3 px-[20px] pt-[30px] pb-[15px]">
                  <div className="flex-1">
                    <label className="block text-sm text-[#6E777D] mb-1">
                      Min price
                    </label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={e => SetminPrice(Number(e.target.value))}
                      className="w-full border border-[#e2e2e2] rounded-[4px] px-[15px] py-1.5 outline-none font-medium text-[#2C3C28]"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm text-[#6E777D] mb-1">
                      Max price
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={e => SetmaxPrice(Number(e.target.value))}
                      className="w-full border border-[#e2e2e2] rounded-[4px] px-[15px] py-1.5 outline-none font-medium text-[#2C3C28]"
                    />
                  </div>
                </div>
                <div className="px-[20px] mb-[30px]">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={CurrentPrice}
                    onChange={handleRangeChange}
                    className="w-full h-2 bg-[#E6963A] rounded-lg appearance-none cursor-pointer accent-[#E6963A]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="mt-3 text-[16px] font-nunito font-normal text-[#6E777D]">
                      Price: ${minPrice} — ${maxPrice}
                    </p>

                    <button
                      onClick={handleFilter}
                      className="mt-3 bg-[#E6963A] text-white font-semibold py-2 px-4 rounded-md cursor-pointer"
                    >
                      Filter
                    </button>
                  </div>
                </div>
              </div>
              <div className="mb-[20px] border border-[#e2e2e2] rounded-[8px]">
                <h5 className="text-[20px] font-nunito font-bold text-[#2C3C28] border-b border-[#e2e2e2] py-[30px] pl-[30px] pr-[20px]">
                  Product Categories
                </h5>
              </div>
            </div>
          )}

          <div className="mobile:w-full tablet:w-full  laptop:w-[670px] computer:w-[915px]">
            <div className="flex justify-between items-center bg-[#F3F4F6] rounded-[6px] p-[15px] relative">
              <h4>Showing results ({products.length})</h4>

              <button
                onClick={() => setOpen(prev => !prev)}
                className="text-[16px] mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px]  font-nunito font-semibold text-[#FFF] bg-[#E6963A] py-[8px] mobile:px-[10px] tablet:px-[14px] laptop:px-[14px] computer:px-[14px] cursor-pointer rounded-[4px] flex items-center gap-2"
              >
                Sort
                <span className="ml-1.5 ">
                  <FaChevronDown />
                </span>
              </button>
              {open && (
                <div className="absolute top-0 right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <ul className="py-2 text-sm text-gray-700">
                    <li
                      className="px-4 py-2 hover:bg-[#E6963A] hover:text-[#FFF] cursor-pointer transition-all ease-in-out duration-300"
                      onClick={() => {
                        setSortOrder('lowToHigh');
                        setOpen(false);
                      }}
                    >
                      Low to High
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-[#E6963A] hover:text-[#FFF] cursor-pointer transition-all ease-in-out duration-300"
                      onClick={() => {
                        setSortOrder('highToLow');
                        setOpen(false);
                      }}
                    >
                      High To Low
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center mobile:justify-normal computer:justify-normal laptop:justify-normal tablet:justify-center mobile:gap-[10px] tablet:gap-[18px] laptop:gap-[26px] computer:gap-[26px] mobile:mt-[20px] tablet:mt-[50px] laptop:mt-[50px] computer:mt-[50px]">
              {products?.map((pro, idx) => (
                <div
                  key={idx}
                  onClick={() => handleShowProduct(pro._id)}
                  className="relative z-0 mobile:shadow-md tablet:shadow-md laptop:shadow-none computer:shadow-none border border-black/40 mobile:p-1 tablet:p-[3px] laptop:p-[3px] computer:p-[3px] mobile:w-[48%] tablet:w-[31%] laptop:w-[31%] computer:w-[23%] hover:border-[#25ac35] rounded-sm"
                >
                  <div className="mobile:w-full tablet:w-auto laptop:w-full computer:w-full mobile:h-[178px] tablet:h-full laptop:h-[250px] computer:h-[250px] flex items-center justify-center mx-auto overflow-hidden cursor-pointer">
                    <img
                      className="w-full h-full bg-white object-contain cursor-pointer"
                      src={pro.photo[0]}
                      alt="product"
                    />
                  </div>
                  {pro.disCountPrice > 0 && (
                    <div className="absolute top-[5px] left-[5px] bg-green-500 mobile:text-[12px] tablet:text-[14px] laptop:text-[14px] computer:text-[14px] font-nunito font-bold text-white mobile:w-[90px] mobile:h-[30px] tablet:w-[90px] tablet:h-[35px] laptop:w-[90px] laptop:h-[35px] computer:w-[90px] computer:h-[35px] rounded-full flex items-center justify-center z-10">
                      Sale {pro.disCountPrice}% off
                    </div>
                  )}
                  <div className="bg-[#eeeeee] text-center w-full max-h-[220px] pb-[15px]">
                    <h3 className="mobile:text-[14px] wrap-break-word tablet:text-[16px] laptop:text-[15px] computer:text-[15px] pt-2.5 mobile:font-bold tablet:font-bold laptop:font-medium mobile:w-auto tablet:w-[170px] laptop:w-[185px] computer:w-[200px] text-center mx-auto computer:font-medium cursor-pointer font-nunito text-[#1e293b] mb-[5px] line-clamp-3 overflow-hidden text-ellipsis h-[75px]">
                      {pro.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2.5 mx-auto h-[25px]">
                      <h2 className="mobile:text-[16px] tablet:text-[18px] laptop:text-[20px] computer:text-[20px] font-nunito font-bold text-[#a1a0a0] my-line-through">
                        {pro.oldPrice}৳
                      </h2>
                      <h2 className="mobile:text-[18px] tablet:text-[18px] laptop:text-[20px] computer:text-[20px] font-nunito font-bold text-[#778E38]">
                        {pro.price}৳
                      </h2>
                    </div>
                    <h5
                      className={`text-sm font-semibold my-1.5 h-[20px] ${
                        pro.stock >= 1 ? 'text-green-600' : 'text-red-400'
                      }`}
                    >
                      {pro.stock >= 1 ? 'In stock' : 'Out of stock'}
                    </h5>

                    <button
                      onClick={() => handleDirectCheckout(pro._id)}
                      disabled={pro.stock < 1}
                      className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-noto-bengali font-bold text-[#FFF] bg-green-500 border-b-4 border-green-600 mobile:w-full tablet:w-full laptop:w-full computer:w-full mobile:h-[36px] tablet:h-[40px] laptop:h-[40px] computer:h-[40px] rounded-full flex items-center justify-center mx-auto cursor-pointer"
                    >
                      <FaCartShopping className="mr-2.5" />
                      অডার করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mobile:my-[40px] tablet:my-[60px] laptop:my-[60px] computer:my-[60px]">
          <Pagination
            active={currentPage}
            setActive={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
      </Container>
    </section>
  );
};

export default ClientShop;
