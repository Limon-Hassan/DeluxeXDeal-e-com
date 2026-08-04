'use client';
import Container from './Container/Container';
import { IoSearchSharp } from 'react-icons/io5';
import { LuShoppingBag } from 'react-icons/lu';
import { RxHamburgerMenu } from 'react-icons/rx';
import { RxCross1 } from 'react-icons/rx';
import { FaBangladeshiTakaSign, FaChevronDown } from 'react-icons/fa6';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import socket from '../utills/socket';
import Navber from './Navber';
import Navber_2 from './Navber_2';

const Navber_1 = () => {
  let [open, setOpen] = useState(false);
  let router = useRouter();
  let [cartCount, setCartCount] = useState(0);
  const [category, setCategory] = useState([]);
  let [TotalPrice, setTotalPrice] = useState(0);
  let [search, setSearch] = useState('');
  let [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    const updateCartInfo = () => {
      const cartData = JSON.parse(localStorage.getItem('cartInfo')) || {
        cartLength: 0,
        totalPrice: 0,
      };
      setCartCount(cartData.cartLength);
      setTotalPrice(cartData.totalPrice);
    };

    updateCartInfo();

    window.addEventListener('storage', updateCartInfo);
    window.addEventListener('cartUpdated', updateCartInfo);

    return () => {
      window.removeEventListener('storage', updateCartInfo);
      window.removeEventListener('cartUpdated', updateCartInfo);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSuggestion = data => {
      if (!search.trim()) return;
      if (
        data?.query &&
        data.query.toLowerCase().includes(search.toLowerCase())
      ) {
        setSuggestions(data.suggestions || []);
      } else if (data?.products) {
        setSuggestions(
          data.products
            .map(p => ({
              name: p.name,
              photo: p.photo?.[0] || [],
            }))
            .slice(0, 8),
        );
      }
    };

    const handleError = err => {
      console.error('Search error:', err);
    };

    socket.on('searchSuggestion', handleSuggestion);
    socket.on('searchError', handleError);

    return () => {
      socket.off('searchSuggestion', handleSuggestion);
      socket.off('searchError', handleError);
    };
  }, [socket, search]);

  const handleSearch = async e => {
    const value = e.target.value;
    setSearch(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }

      socket.emit('searchProducts', { query: value, page: 1, limit: 20 });
      const queryParams = new URLSearchParams({
        query: value,
        page: 1,
        limit: 20,
      });

      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_SERVER_PORT
          }api/v3/product/product/searchProduct?${queryParams.toString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!res.ok) throw new Error('Failed to fetch search results');

        const data = await res.json();
        const names = [...(data.mainProducts || []), ...(data.related || [])]
          .slice(0, 8)
          .map(p => ({
            name: p.name,
            photo: p.photo?.[0] || [],
          }));

        setSuggestions(names);
      } catch (err) {
        console.error('Search request failed:', err);
      }
    }, 200);
  };

  const handleShow = async () => {
    if (!search.trim()) return;
    let currentSearch = search.trim();
    try {
      const params = new URLSearchParams({
        query: currentSearch,
        page: 1,
        limit: 20,
      }).toString();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/product/searchProduct?${params}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch search results');
      router.push(`/shop?search=${encodeURIComponent(currentSearch)}`);
      setSearch('');
      setSuggestions([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestionClick = async s => {
    try {
      const params = new URLSearchParams({ query: s.name || s }).toString();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/product/searchProduct?${params}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      );

      if (!res.ok) throw new Error('Failed to fetch search results');
      const data = await res.json();

      const product = data.mainProducts?.[0] || data.related?.[0];
      if (product?._id) {
        const productName = encodeURIComponent(
          product.name.replace(/\s+/g, '-'),
        );
        window.location.href = `/productDetails/${product._id}/${productName}`;
      }

      setSearch('');
      setSuggestions([]);
    } catch (err) {
      console.error(err);
    }
  };

  async function Fetch() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/category/getCategory`,
        {
          cache: 'no-store',
        },
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCategory(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    Fetch();

    const handleNewCategory = newCategory => {
      setCategory(prev => [...prev, newCategory]);
    };

    socket.on('CategoryCreated', handleNewCategory);

    return () => {
      socket.off('CategoryCreated', handleNewCategory);
    };
  }, []);

  let handleSubmit = async category => {
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_SERVER_PORT
        }api/v3/category/getCategory?id=${encodeURIComponent(category)}`,
        {
          cache: 'no-store',
        },
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      window.location.href = `/category/${category}`;
    } catch (error) {
      console.error(error.message);
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <div className="w-full fixed top-0 left-0 z-50">
        <Navber />
        {/* <section
          className={`w-full bg-[#ededed] mobile:py-0 tablet:py-5 laptop:py-2 computer:py-0`}
        >
          <Container>
            <div className="mobile:relative tablet:relative laptop:flex computer:flex computer:items-center computer:justify-between laptop:items-center laptop:justify-between">
              <div className="computer:flex laptop:flex computer:items-center laptop:items-center mobile:gap-0 tablet:gap-0 laptop:gap-[30px] computer:gap-[50px]">
                <div className="mobile:mb-0 tablet:mb-5 mobile:flex tablet:flex mobile:justify-between tablet:justify-between mobile:items-center tablet:items-center">
                  <button
                    onClick={() => setOpen(prev => !prev)}
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    className=" py-2 px-2 mobile:block tablet:block laptop:hidden computer:hidden bg-black/20 rounded-full  text-white font-bold tablet:text-[20px] mobile:text-[15px]"
                  >
                    {open ? <RxCross1 /> : <RxHamburgerMenu />}
                  </button>

                  <a href="/">
                    <img
                      className="computer:w-[250px] laptop:w-[250px] mobile:w-[170px] tablet:w-[250px]  computer:mb-0 laptop:mb-0"
                      src="/HeaderImage.png"
                      alt="headimage"
                    />
                  </a>
                  <a href="/cart">
                    <div className=" mobile:flex tablet:flex computer:hidden laptop:hidden relative mobile:items-center table:items-center gap-2">
                      <LuShoppingBag className="text-[25px] text-[#69727d]" />
                      <span className="flex items-center mobile:text-[15px] tablet:text-[20px] text-[#69727d]">
                        {(TotalPrice && TotalPrice) || 0}.0
                        <FaBangladeshiTakaSign />
                      </span>
                      <span className="absolute -top-2.5 right-[60px] bg-[#E6963A] text-white rounded-full w-5 flex justify-center items-center h-5 text-sm ">
                        {cartCount}
                      </span>
                    </div>
                  </a>
                </div>
                <div className="relative border border-[#E6963A] rounded-sm flex items-center mobile:gap-2 tablet:gap-5 laptop:gap-5 w-auto computer:gap-5 p-1.5">
                  <input
                    value={search}
                    onChange={handleSearch}
                    className="computer:w-[400px] computer:h-[50px] laptop:w-[400px] laptop:h-[50px] tablet:w-[423px] tablet:h-[50px] mobile:w-full mobile:h-10 border border-[#D1D5DB] bg-white rounded-[5px] p-2.5 text-[18px] font-nunito font-normal text-black "
                    type="search"
                    placeholder="Search..."
                    name="search"
                    id="search"
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute left-0 top-[65px] w-full bg-white rounded shadow z-10">
                      {suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 cursor-pointer"
                          onClick={() => handleSuggestionClick(s.name)}
                        >
                          <img
                            src={s.photo}
                            alt={s.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <span className=" text-[16px] truncate mobile:w-[300px] tablet:w-[550px] laptop:w-[550px] computer:w-[550px]">
                            {s.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={handleShow}
                    className="mobile:text-[14px] tablet:text-[16px] laptop:-[16px] computer:text-[16px]  font-nunito font-bold text-white bg-[#E6963A] rounded-md mobile:py-2 tablet:py-3 laptop:py-3 computer:py-3 mobile:px-2.5 tablet:px-6 laptop:px-6 computer:px-6 cursor-pointer flex items-center mobile:gap-[3px] tablet:gap-2 laptop:gap-2 computer:gap-2"
                  >
                    <IoSearchSharp /> Search
                  </button>
                </div>
              </div>
              <a href="/cart">
                <div className="relative computer:flex computer:items-center laptop:items-center laptop:flex computer:gap-2 laptop:gap-2 mobile:hidden tablet:hidden">
                  <LuShoppingBag className="text-[25px] text-[#69727d]" />
                  <span className="flex items-center  text-[20px] text-[#69727d]">
                    {(TotalPrice && TotalPrice) || 0}.0
                    <FaBangladeshiTakaSign />
                  </span>
                  <span className="absolute -top-3 right-[75px] bg-[#E6963A] text-white rounded-full w-6 flex justify-center items-center h-6 text-sm ">
                    {cartCount}
                  </span>
                </div>
              </a>
            </div>
            <div
              id="mobile-menu"
              className={
                `absolute left-0 right-0 mobile:top-[65px] tablet:top-[120px] bg-white shadow-md z-50 max-h-[380px] overflow-scroll
               transform origin-top transition-all   duration-300 ease-in-out
               ` +
                (open
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-3 pointer-events-none')
              }
            >
              <ul className="mobile:flex-col tablet:flex-col mobile:items-center tablet:items-center mobile:mb-2.5 tablet:mb-[15px] mobile:p-2.5 tablet:p-5">
                {category.map((c, i) => (
                  <li
                    key={i}
                    onClick={() => handleSubmit(c._id)}
                    className="mobile:text-[18px] tablet:text-[18px] font-nunito font-Bold text-[#161414] mobile:mb-2.5 cursor-pointer"
                  >
                    {c.name}
                  </li>
                ))}
                <a
                  href="/shop"
                  className="mobile:text-[15px] tablet:text-[18px] font-nunito font-medium text-[#484848] mobile:mb-2.5 flex items-center justify-between  cursor-pointer"
                >
                  Shop
                  <span>
                    <FaChevronDown />
                  </span>
                </a>
              </ul>
            </div>
          </Container>
        </section> */}

        <section
          className={`w-full bg-[#ededed] mobile:py-0 tablet:py-5 laptop:py-2 computer:py-0`}
        >
          <Container>
            <div className="mobile:relative tablet:relative laptop:flex computer:flex computer:items-center computer:justify-between laptop:items-center laptop:justify-between">
              <div className="computer:flex laptop:flex computer:items-center laptop:items-center mobile:gap-0 tablet:gap-0 laptop:gap-[30px] computer:gap-[50px]">
                <div className="mobile:mb-0 tablet:mb-5 mobile:flex tablet:flex mobile:justify-between tablet:justify-between mobile:items-center tablet:items-center">
                  <button
                    onClick={() => setOpen(prev => !prev)}
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    className=" py-1.5 px-1.5 mobile:block tablet:block laptop:hidden computer:hidden bg-black/20 rounded-full  text-white font-bold tablet:text-[20px] mobile:text-[13px]"
                  >
                    {open ? <RxCross1 /> : <RxHamburgerMenu />}
                  </button>

                  <a href="/">
                    <img
                      className="computer:w-[250px] laptop:w-[250px] mobile:w-[140px] tablet:w-[250px]  computer:mb-0 laptop:mb-0"
                      src="/HeaderImage.png"
                      alt="headimage"
                    />
                  </a>
                  <a href="/cart">
                    <div className=" mobile:flex tablet:flex computer:hidden laptop:hidden relative mobile:items-center table:items-center gap-2">
                      <LuShoppingBag className="mobile:text-[20px] tablet:text-[25px] text-[#69727d]" />
                      <span className="flex items-center mobile:text-[13px] tablet:text-[20px] text-[#69727d]">
                        {(TotalPrice && TotalPrice) || 0}.0
                        <FaBangladeshiTakaSign />
                      </span>
                      <span className="absolute mobile:-top-2 tablet:-top-2.5 right-[60px] bg-[#E6963A] text-white rounded-full mobile:w-4 tablet:w-5 flex justify-center items-center mobile:h-4 tablet:h-5 mobile:text-[11px] tablet:text-sm ">
                        {cartCount}
                      </span>
                    </div>
                  </a>
                </div>
                <div className="relative border border-[#E6963A] rounded-sm flex items-center mobile:gap-1.5 tablet:gap-5 laptop:gap-5 w-auto computer:gap-5 p-1.5">
                  <input
                    value={search}
                    onChange={handleSearch}
                    className="computer:w-[400px] computer:h-[50px] laptop:w-[400px] laptop:h-[50px] tablet:w-[423px] tablet:h-[50px] mobile:w-full mobile:h-9 border border-[#D1D5DB] bg-white rounded-[5px] p-2.5 mobile:text-[15px] tablet:text-[18px] font-nunito font-normal text-black "
                    type="search"
                    placeholder="Search..."
                    name="search"
                    id="search"
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute left-0 mobile:top-[55px] tablet:top-[65px] w-full bg-white rounded shadow z-10">
                      {suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 cursor-pointer"
                          onClick={() => handleSuggestionClick(s.name)}
                        >
                          <img
                            src={s.photo}
                            alt={s.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <span className=" text-[16px] truncate mobile:w-[300px] tablet:w-[550px] laptop:w-[550px] computer:w-[550px]">
                            {s.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={handleShow}
                    className="mobile:text-[12px] tablet:text-[16px] laptop:-[16px] computer:text-[16px]  font-nunito font-bold text-white bg-[#E6963A] rounded-md mobile:py-1.5 tablet:py-3 laptop:py-3 computer:py-3 mobile:px-2 tablet:px-6 laptop:px-6 computer:px-6 cursor-pointer flex items-center mobile:gap-[3px] tablet:gap-2 laptop:gap-2 computer:gap-2"
                  >
                    <IoSearchSharp /> Search
                  </button>
                </div>
              </div>
              <a href="/cart">
                <div className="relative computer:flex computer:items-center laptop:items-center laptop:flex computer:gap-2 laptop:gap-2 mobile:hidden tablet:hidden">
                  <LuShoppingBag className="text-[25px] text-[#69727d]" />
                  <span className="flex items-center  text-[20px] text-[#69727d]">
                    {(TotalPrice && TotalPrice) || 0}.0
                    <FaBangladeshiTakaSign />
                  </span>
                  <span className="absolute -top-3 right-[75px] bg-[#E6963A] text-white rounded-full w-6 flex justify-center items-center h-6 text-sm ">
                    {cartCount}
                  </span>
                </div>
              </a>
            </div>
            <div
              id="mobile-menu"
              className={
                `absolute left-0 right-0 mobile:top-[58px] tablet:top-[120px] bg-white shadow-md z-50 max-h-[380px] overflow-scroll
       transform origin-top transition-all   duration-300 ease-in-out
       ` +
                (open
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-3 pointer-events-none')
              }
            >
              <ul className="mobile:flex-col tablet:flex-col mobile:items-center tablet:items-center mobile:mb-2.5 tablet:mb-[15px] mobile:p-2.5 tablet:p-5">
                {category.map((c, i) => (
                  <li
                    key={i}
                    onClick={() => handleSubmit(c._id)}
                    className="mobile:text-[15px] tablet:text-[18px] font-nunito font-Bold text-[#161414] mobile:mb-2.5 cursor-pointer"
                  >
                    {c.name}
                  </li>
                ))}
                <a
                  href="/shop"
                  className="mobile:text-[14px] tablet:text-[18px] font-nunito font-medium text-[#484848] mobile:mb-2.5 flex items-center justify-between  cursor-pointer"
                >
                  Shop
                  <span>
                    <FaChevronDown />
                  </span>
                </a>
              </ul>
            </div>
          </Container>
        </section>
        <Navber_2 />
      </div>
    </>
  );
};

export default Navber_1;
