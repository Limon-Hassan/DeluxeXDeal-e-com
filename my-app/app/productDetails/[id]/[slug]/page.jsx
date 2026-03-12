'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Container from '../../../../Componets/Container/Container';
import { PiStarFill } from 'react-icons/pi';
import { FaBagShopping, FaCartShopping } from 'react-icons/fa6';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import ProductDetails from '../../../../Componets/ProductDetails';
import CustomerReview from '../../../../Componets/CustomerReview';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { IoCheckmarkDoneCircleOutline } from 'react-icons/io5';
import { FaWhatsapp } from 'react-icons/fa';

const Page = () => {
  const [product, setProduct] = useState('');
  const [RelatedProduct, setRelatedProduct] = useState([]);
  const [addedCart, setAddedCart] = useState([]);
  let router = useRouter();
  const { id } = useParams();
  const images = product && Array.isArray(product.photo) ? product.photo : [];
  let [active, setActive] = useState({
    a: false,
    b: false,
  });

  const [selectedImage, setSelectedImage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [zoomStyle, setZoomStyle] = useState({
    backgroundPosition: 'center',
    backgroundSize: '100%',
  });

  useEffect(() => {
    if (product && Array.isArray(product.photo) && product.photo.length > 0) {
      setSelectedImage(product.photo[0]);
    }
  }, [product]);

  const handleMouseMove = e => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomStyle(prev => ({ ...prev, backgroundPosition: `${x}% ${y}%` }));
  };

  const handleMouseEnter = () => {
    setZoomStyle(prev => ({ ...prev, backgroundSize: '200%' }));
  };

  const handleMouseLeave = () => {
    setZoomStyle({ backgroundPosition: 'center', backgroundSize: '100%' });
  };

  let handleActive = type => {
    setActive({
      a: false,
      b: false,
      [type]: true,
    });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      let product = id;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/getProduct?id=${product}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct(data.product);
        setRelatedProduct(data.relatedProduct);
      } catch (err) {
        console.log(err);
      }
    };

    fetchProduct();
  }, [id]);

  let handleShowProduct = async product => {
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/getProduct?id=${product}`,
      );

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      router.push(
        `/productDetails/${data.product._id}/${data.product.name.replace(
          /\s+/g,
          '-',
        )}`,
      );
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

  let handleCart = async proID => {
    try {
      let cartID = localStorage.getItem('cartID');
      if (!cartID) {
        cartID = uuidv4();
        localStorage.setItem('cartID', cartID);
      }
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/cart/addCart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartId: cartID,
            productId: proID,
          }),
        },
      );
      if (!response.ok) throw new Error('Failed to fetch product');
      let data = await response.json();
      let cartInfo = JSON.parse(localStorage.getItem('cartInfo')) || {
        cartLength: 0,
        totalPrice: 0,
        productIds: [],
      };
      if (!cartInfo.productIds.includes(proID)) {
        cartInfo.productIds.push(proID);
      }

      cartInfo.cartLength = data.data.items.length;
      cartInfo.totalPrice = data.data.totalPrice;

      localStorage.setItem('cartInfo', JSON.stringify(cartInfo));
      setAddedCart(cartInfo.productIds);

      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let cartInfo = JSON.parse(localStorage.getItem('cartInfo'));

    if (cartInfo?.productIds) {
      setAddedCart(cartInfo.productIds);
    }
  }, []);

  useEffect(() => {
    if (product && product.name) {
      document.title = `${product.name} | Deluxe X Deal`;
    }
  }, [product]);

  return (
    <>
      <Head>
        <title>
          {product && product.name
            ? `${product.name} | Deluxe X Deal`
            : 'Loading Product... | Deluxe X Deal'}
        </title>
        <meta
          name="description"
          content={
            product && product.description
              ? product.description.slice(0, 150)
              : 'View product details and best deals on Deluxe X Deal.'
          }
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="mobile:pt-[150px] mobile:pb-[50px] tablet:py-[80px] laptop:py-[100px] computer:pt-[270px] computer:pb-[100px]">
        <Container>
          <div className="flex flex-col lg:flex-row mobile:gap-[20px] tablet:gap-[50px] laptop:gap-[100px] computer:gap-[100px]">
            <div className="image_part relative shadow-md flex flex-col items-center">
              <div
                className=" mobile:w-[300px] mobile:h-[300px] tablet:w-[400px] tablet:h-[400px] laptop:w-[400px] laptop:h-[400px] computer:w-[400px] computer:h-[400px] rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat cursor-zoom-in"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  ...zoomStyle,
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              ></div>
              <button
                className="absolute top-2 right-2 bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-200 transition cursor-pointer"
                onClick={() => setIsFullscreen(true)}
              >
                <FaMagnifyingGlass />
              </button>
              {isFullscreen && (
                <div
                  className="fixed inset-0 bg-black flex items-center justify-center z-50"
                  onClick={() => setIsFullscreen(false)}
                >
                  <img
                    src={selectedImage}
                    alt="fullscreen"
                    className="mobile:max-w-[90%] mobile:max-h-auto tablet:max-w-[90%] tablet:max-h-[70%] laptop:max-h-[90%] laptop:max-w-[90%] computer:max-h-[90%] computer:max-w-[90%] object-contain rounded-lg shadow-lg"
                  />
                  <button
                    className="absolute top-5 right-5 text-white text-3xl font-bold cursor-pointer"
                    onClick={() => setIsFullscreen(false)}
                  >
                    ✖
                  </button>
                </div>
              )}
              <div className="flex items-center gap-[20px] my-[20px]">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="product thumbnail"
                    className={`mobile:w-[60px] tablet:w-[80px] laptop:w-[80px] computer:w-[80px] h-auto rounded-md cursor-pointer transition-all duration-300 ${
                      selectedImage === img
                        ? 'opacity-100 border-1 border-black/30'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            </div>

            <div className="text_part ">
              <h3 className="mobile:text-[18px] tablet:text-[24px] laptop:text-[24px] computer:text-[24px] font-bold font-nunito text-[#383535] mobile:w-auto tablet:w-[486px] laptop:w-[486px] computer:w-[486px] leading-snug mb-[10px]">
                {product.name}
              </h3>

              <span className="flex items-center gap-1.5 mb-[20px]">
                {[...Array(5)].map((_, i) => (
                  <PiStarFill key={i} className="text-[#FDA256]" />
                ))}
                <span className="text-[16px] font-nunito text-[#6E777D] ml-2">
                  ({product.Totalreviews || 0} Reviews)
                </span>
              </span>

              <h4 className="text-[24px] font-bold font-nunito mb-[20px] text-[#FDA256]">
                {product.price}৳
              </h4>

              <div className="border-t border-[#000]/30 pt-[15px]">
                <p className="text-[15px] text-[#555] font-bold">
                  Categories: {product.category?.[0]?.name}
                </p>
                <p className="text-[15px] text-[#555] font-bold">
                  Brand: {product.brand}
                </p>
                <div className="w-full flex flex-col gap-2 items-center mt-3.5">
                  <button
                    onClick={() => handleDirectCheckout(product._id)}
                    className="text-[16px] font-bold font-nunito text-white bg-[#F2B10C] py-[10px] mobile:w-full tablet:w-full laptop:w-[180px] computer:w-[220px] rounded-[6px] cursor-pointer hover:bg-[#e1a60b] transition duration-300 ease-in-out flex items-center justify-center gap-2"
                  >
                    <FaCartShopping size={24} /> অর্ডার করুন
                  </button>
                  <button
                    disabled={addedCart.includes(product._id)}
                    onClick={() => handleCart(product._id)}
                    className={`text-[16px] font-bold font-nunito text-white ${addedCart.includes(product._id) ? 'bg-green-500 opacity-60 cursor-not-allowed ' : 'bg-green-600'} py-[10px] mobile:w-full tablet:w-full laptop:w-[180px] computer:w-[220px] rounded-[6px] cursor-pointer hover:bg-transparent hover:border hover:border-green-500 hover:text-green-500 transition duration-300 ease-in-out flex items-center justify-center gap-2 active:scale-95`}
                  >
                    {addedCart.includes(product._id) ? (
                      <>
                        <IoCheckmarkDoneCircleOutline size={24} /> কার্টে যুক্ত
                        হয়েছে
                      </>
                    ) : (
                      <>
                        <FaBagShopping size={24} /> কার্টে যোগ করুন
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bottom_part">
            <div className="flex items-center mobile:gap-[65px] tablet:gap-[50px] laptop:gap-[50px] computer:gap-[50px] mt-[30px]">
              <button
                onClick={() => handleActive('a')}
                className={`mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-bold ${
                  active.a && 'border-t-4 border-[#f1a31c] border-solid'
                } font-nunito text-[#515151] cursor-pointer border-dotted border-t border-r py-[10px] px-[20px]`}
              >
                Description
              </button>

              <button
                onClick={() => handleActive('b')}
                className={`mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-bold ${
                  active.b && 'border-t-4 border-[#f1a31c] border-solid'
                } font-nunito text-[#515151] cursor-pointer border-t border-dotted border-r  py-[10px] px-[20px]`}
              >
                Reviews ({product.Totalreviews || 0})
              </button>
            </div>
            <div className="mt-8 relative">
              {(active.a && <ProductDetails product={product} />) ||
                (active.b && <CustomerReview product={product} />)}
            </div>
          </div>
          <div className="related-products mt-[50px]">
            <h3 className="text-[#1e293b] font-nunito font-bold text-[20px] mb-[10px] border-b border-dashed border-[#000]">
              You May Also Like
            </h3>
            <div className="flex flex-wrap items-center mobile:justify-normal computer:justify-normal laptop:justify-normal tablet:justify-center mobile:gap-[10px] tablet:gap-[18px] laptop:gap-[26px] computer:gap-[26px] mt-[50px]">
              {RelatedProduct?.map((pro, idx) => (
                <div
                  key={idx}
                  className="relative z-0 mobile:shadow-md tablet:shadow-md laptop:shadow-none computer:shadow-none border border-black/40 mobile:p-1 tablet:p-[3px] laptop:p-[3px] computer:p-[3px] mobile:w-[48%] tablet:w-[31%] laptop:w-[31%] computer:w-[23%] hover:border-[#F1A31C] rounded-sm"
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
                    <div className="absolute top-[5px] left-[5px] bg-[#E6963A] mobile:text-[12px] tablet:text-[14px] laptop:text-[14px] computer:text-[14px] font-nunito font-bold text-white mobile:w-[90px] mobile:h-[30px] tablet:w-[90px] tablet:h-[35px] laptop:w-[90px] laptop:h-[35px] computer:w-[90px] computer:h-[35px] rounded-full flex items-center justify-center z-10">
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
                      className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-noto-bengali font-bold text-[#FFF] bg-[#F1A31C] border-b-4 border-[#BD8017] mobile:w-full tablet:w-full laptop:w-full computer:w-full mobile:h-[36px] tablet:h-[40px] laptop:h-[40px] computer:h-[40px] rounded-full flex items-center justify-center mx-auto cursor-pointer"
                    >
                      <FaCartShopping className="mr-2.5" />
                      অডার করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
        <div>
          <a
            href="https://wa.me/8801813336311"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition z-50"
          >
            <FaWhatsapp size={28} />
          </a>
        </div>
      </section>
    </>
  );
};

export default Page;
