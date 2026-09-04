'use client';

import { useEffect, useState } from 'react';
import Container from './Container/Container';
import { FaCartShopping } from 'react-icons/fa6';
import socket from '../utills/socket';
import { useInView } from 'react-intersection-observer';
import PulseLoader from 'react-spinners/PulseLoader';
import { motion } from 'framer-motion';

const Page_1 = () => {
  const [products, SetProduct] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  async function ProductFetch() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/getProduct?page=${page}&limit=20`,
        {
          cache: 'no-store',
        },
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        SetProduct(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  useEffect(() => {
    ProductFetch();
  }, []);

  useEffect(() => {
    socket.on('CategoryCreated', newCategory => {
      SetProduct(prev => [...prev, newCategory.Product]);
    });

    return () => socket.off('CategoryCreated');
  }, [socket]);

  useEffect(() => {
    if (inView && !loading && hasMore) {
      ProductFetch();
    }
  }, [inView]);

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

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <>
      <section className="mobile:w-full tablet:w-full mobile:pb-[30px] tablet:pb-5 laptop:pb-[30px] computer:pb-[30px] bg-[#E6963A]/30">
        <Container>
          <div className=" flex items-center justify-center border-b border-dashed border-black">
            <h3 className=" bg-white px-3 py-1 mobile:text-[15px] tablet:text-[18px] laptop:text-[18px] computer:text-[18px] font-nunito mobile:font-bold tablet:font-normal laptop:font-medium computer:font-medium text-[#1e293b] -mb-[17px] rounded-md">
              Our All Fetured Products
            </h3>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center mobile:justify-normal computer:justify-normal laptop:justify-normal tablet:justify-center mobile:gap-2.5 tablet:gap-[18px] laptop:gap-[26px] computer:gap-[26px] mobile:mt-[50px] tablet:mt-[50px] laptop:mt-[50px] computer:mt-[50px] "
          >
            {products.map((pro, idx) => (
              <motion.div
                key={idx}
                initial={{
                  opacity: 0.5,
                  filter: 'blur(6px)',
                }}
                animate={{
                  opacity: 1,
                  filter: 'blur(0px)',
                }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.15,
                  ease: 'easeOut',
                }}
                className="relative z-0 mobile:shadow-md tablet:shadow-md laptop:shadow-none computer:shadow-none border border-black/40 mobile:p-1 tablet:p-[3px] laptop:p-[3px] computer:p-[3px] mobile:w-[48%] tablet:w-[31%] laptop:w-[31%] computer:w-[23%] hover:border-[#25ac35] rounded-sm "
              >
                <div
                  onClick={() => handleShowProduct(pro._id)}
                  className="mobile:w-full tablet:w-auto laptop:w-full computer:w-full mobile:h-[178px] tablet:h-full laptop:h-[250px] computer:h-[250px] flex items-center justify-center mx-auto overflow-hidden cursor-pointer"
                >
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
              </motion.div>
            ))}

            {loading && (
              <div className="w-full flex items-center justify-center py-5">
                <PulseLoader color="#E6963A" size={20} />
              </div>
            )}
            <div ref={ref} className="h-10"></div>
          </motion.div>
        </Container>
      </section>
    </>
  );
};

export default Page_1;
