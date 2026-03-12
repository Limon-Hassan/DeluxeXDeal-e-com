'use client';
import React, { useEffect, useState } from 'react';
import { RxCross1 } from 'react-icons/rx';
import Container from '../../Componets/Container/Container';
import CheckBox from '../../Componets/CheckBox';
import socket from '../../utills/socket';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { ImSpinner6 } from 'react-icons/im';

const page = () => {
  let { enqueueSnackbar } = useSnackbar();
  let [Selectpayment, setSelectpayment] = useState('outsideDhaka');
  let [cartData, setCartData] = useState([]);
  let [SummeryData, setSummeryData] = useState({});
  let [loding, setLoding] = useState(false);
  let router = useRouter();

  let handlePaymentChange = paymentMethod => {
    setSelectpayment(paymentMethod);
  };

  async function FetchSummery() {
    setLoding(true);
    let cartId = localStorage.getItem('cartID');
    try {
      if (!Selectpayment) return;
      let res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/cart/CartSummery?cartId=${cartId}&area=${Selectpayment}`,
      );

      if (!res.ok) throw new Error('Failed to fetch CartSummery');

      let SumaaryData = await res.json();
      setSummeryData(SumaaryData.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoding(false);
    }
  }

  useEffect(() => {
    FetchSummery();
  }, [Selectpayment]);

  async function FetchCart() {
    setLoding(true);
    let cartId = localStorage.getItem('cartID');
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/cart/reatCart?cartId=${cartId}`,
      );

      if (!response.ok) throw new Error('Failed to fetch Cart');
      let data = await response.json();

      setCartData(data.data.items);
    } catch (error) {
      console.log(error);
    } finally {
      setLoding(false);
    }
  }

  useEffect(() => {
    FetchCart();
  }, []);

  useEffect(() => {
    let cartId = localStorage.getItem('cartID');
    socket.emit('joinCart', { cartId });

    const handleItemDeleted = ({ updatedCart }) => {
      setCartData(updatedCart.items);
    };

    const handleCartFetched = ({ items }) => {
      setCartData(items);
    };
    const handleSummery = data => {
      setSummeryData(data);
    };
    const handleIncrement = data => {
      setCartData(data.cartItems.items);
      setSummeryData(data.cartItems);
    };

    const handleDeletedCart = ({ cartId }) => {
      localStorage.removeItem('CARTID');
      localStorage.removeItem('cartInfo');
      setCartData([]);
      setSummeryData({});
    };

    socket.on('itemDeleted', handleItemDeleted);
    socket.on('cartFetched', handleCartFetched);
    socket.on('deletedcart', handleDeletedCart);
    socket.on('cartSummery', handleSummery);
    socket.on('IncrementCart', handleIncrement);

    return () => {
      socket.off('itemDeleted', handleItemDeleted);
      socket.off('cartFetched', handleCartFetched);
      socket.off('deletedcart', handleDeletedCart);
      socket.off('cartSummery', handleSummery);
      socket.off('IncrementCart', handleIncrement);
    };
  }, []);

  let handleCartDelete = async proId => {
    setLoding(true);
    const isMobile = window.innerWidth < 768;
    let cartId = localStorage.getItem('cartID');

    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/cart/deleteCart?cartId=${cartId}&productId=${proId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) throw new Error('Failed to Delete cart');
      let data = await response.json();

      if (data.msg === 'Item deleted successfully!') {
        await FetchCart();
        await FetchSummery();
        const cartInfo = JSON.parse(localStorage.getItem('cartInfo')) || {};
        const updatedItems = (cartInfo.items || []).filter(
          item => item.productId !== proId,
        );
        const updatedTotalPrice = updatedItems.reduce(
          (acc, i) => acc + i.price * i.quantity,
          0,
        );
        const updatedCartInfo = {
          items: updatedItems,
          cartLength: updatedItems.length,
          totalPrice: updatedTotalPrice,
        };
        localStorage.setItem('cartInfo', JSON.stringify(updatedCartInfo));
        window.dispatchEvent(new Event('storage'));
        enqueueSnackbar(data.msg, {
          variant: 'info',
          anchorOrigin: {
            vertical: 'top',
            horizontal: isMobile ? 'center' : 'right',
          },
          style: {
            width: isMobile ? '300px' : '350px',
            fontSize: isMobile ? '14px' : '16px',
            backgroundColor: '#629D23',
            color: '#fff',
            padding: '10px 15px',
            borderRadius: '8px',
          },
        });
      }

      if (data.msg === 'Cart deleted successfully!') {
        localStorage.removeItem('CARTID');
        localStorage.removeItem('cartInfo');
        setCartData([]);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoding(false);
    }
  };

  let HandleIncrement = async (action, productId) => {
    setLoding(true);
    const isMobile = window.innerWidth < 768;
    let cartId = localStorage.getItem('cartID');
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/cart/IncrementCart?cartId=${cartId}&action=${action}&productId=${productId}`,
        { method: 'PUT' },
      );

      if (!response.ok) throw new Error('Failed to Delete Increment');
      let data = await response.json();
      setCartData(data.data.items);
      if (data.msg) {
        enqueueSnackbar(data.msg, {
          variant: 'info',
          anchorOrigin: {
            vertical: 'top',
            horizontal: isMobile ? 'center' : 'right',
          },
          style: {
            width: isMobile ? '300px' : '350px',
            fontSize: isMobile ? '14px' : '16px',
            backgroundColor: '#629D23',
            color: '#fff',
            padding: '10px 15px',
            borderRadius: '8px',
          },
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoding(false);
    }
  };

  let handleCheckout = () => {
    let CARTID = localStorage.getItem('cartID');
    if (!cartData) {
      return enqueueSnackbar('cart is empty', { variant: 'info' });
    }

    router.push(
      `/menual-order/${cartData.map(item => item.productId._id)}/${CARTID.replace(
        /\s+/g,
        '-',
      )}`,
    );
  };

  let handleShowProduct = async product => {
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_PORT}api/v3/product/getProduct?id=${product}`,
      );

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      window.location.href = `/productDetails/${
        data.product._id
      }/${data.product.name.replace(/\s+/g, '-')}`;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {loding === true ? (
        <div className=" flex items-center justify-center w-full h-screen ">
          <ImSpinner6 className="animate-spin text-[50px]  mx-auto" />
        </div>
      ) : (
        <section className="mobile:pt-[150px] tablet:pt-[300px] laptop:pt-[280px] computer:pt-[280px] mobile:pb-[100px] tablet:pb-[100px] laptop:pb-[400px] computer:pb-[500px]">
          <Container>
            <div>
              <h4 className="text-[30px] font-nunito font-bold text-[#1e293b] mb-5">
                Cart
              </h4>
              <div className="border border-black/30 mb-[50px]">
                <div className="flex items-center justify-between mobile:p-[5px] tablet:p-2.5 laptop:p-[15px] computer:p-[15px] border-b border-black/30 bg-[#fbfbfb]">
                  <div>
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[18px] computer:text-[18px] font-nunito font-bold text-[#1e293b]">
                      Product
                    </h4>
                  </div>
                  <div className="flex items-center mobile:gap-[15px] tablet:gap-20 laptop:gap-20 computer:gap-20 ">
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[18px] computer:text-[18px] font-nunito font-bold text-[#1e293b]">
                      Price
                    </h4>
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[18px] computer:text-[18px] font-nunito font-bold text-[#1e293b]">
                      Quantity
                    </h4>
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[18px] computer:text-[18px] font-nunito font-bold text-[#1e293b]">
                      Subtotal
                    </h4>
                  </div>
                </div>
                <div className="mobile:h-[250px] tablet:h-[300px] laptop:h-[450px] computer:h-[450px] overflow-y-scroll">
                  {!cartData || cartData.length === 0 ? (
                    <div className="w-full  h-full flex items-center justify-center text-center">
                      <h2 className="text-[30px] font-nunito font-bold text-gray-600">
                        Cart is Empty! ☹️
                      </h2>
                    </div>
                  ) : (
                    cartData?.map((cartProduct, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between mobile:p-[5px] tablet:p-2.5 laptop:p-[15px] computer:p-[15px] border-b border-black/30"
                      >
                        <div className="flex items-center mobile:gap-[5px] tablet:gap-2.5 laptop:gap-5 computer:gap-5">
                          <span
                            onClick={() =>
                              handleCartDelete(
                                typeof cartProduct.productId === 'string'
                                  ? cartProduct.productId
                                  : cartProduct.productId._id,
                              )
                            }
                            className="mobile:text-[14px] tablet:text-[16px] laptop:text-[20px] computer:text-[20px] cursor-pointer"
                          >
                            <RxCross1 />
                          </span>
                          <img
                            className="mobile:hidden tablet:hidden laptop:block computer:block max-w-[100px] max-h-[100px] cursor-pointer"
                            src={cartProduct.productId.photo?.[0]}
                            alt="product"
                          />
                          <h4
                            onClick={() =>
                              handleShowProduct(cartProduct.productId._id)
                            }
                            className="mobile:text-[13px] tablet:text-[16px] laptop:text-[18px] computer:text-[18px]  font-bold font-nunito text-[#f1a31c] hover:text-[#4169e1] ease-in-out duration-300 cursor-pointer truncate mobile:w-[100px] tablet:w-[150px] laptop:w-[350px] computer:w-[500px]"
                          >
                            {cartProduct.productId.name}
                          </h4>
                        </div>
                        <div className="flex items-center mobile:gap-5 tablet:gap-2.5 laptop:gap-[30px] computer:gap-[30px]">
                          <h4 className="mobile:text-[10px] tablet:text-[16px] laptop:text-[16px]  computer:text-[16px] font-bold font-nunito text-[#1e293b] tablet:flex tablet:items-center tablet:gap-1 laptop:flex laptop:items-center laptop:gap-1 computer:flex computer:items-center computer:gap-1">
                            {cartProduct.productId.price}
                            <span className="mobile:hidden tablet:block laptop:block computer:block">
                              ৳
                            </span>
                          </h4>
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                HandleIncrement(
                                  'Decrement',
                                  cartProduct.productId._id,
                                )
                              }
                              className="mobile:text-[10px] tablet:text-[16px] laptop:text-[16px]  computer:text-[16px] cursor-pointer font-bold border border-black/30 mobile:w-[30px] mobile:h-[30px] tablet:w-10 tablet:h-10 laptop:w-[45px] laptop:h-[45px] computer:w-[45px] computer:h-[45px] flex items-center justify-center"
                            >
                              <FaMinus />
                            </button>
                            <button className="mobile:text-[10px] tablet:text-[16px] laptop:text-[16px]  computer:text-[16px] font-bold border border-black/30 mobile:w-[30px] mobile:h-[30px] tablet:w-10 tablet:h-10 laptop:w-[45px] laptop:h-[45px] computer:w-[45px] computer:h-[45px] flex items-center justify-center">
                              {cartProduct.quantity}
                            </button>
                            <button
                              onClick={() =>
                                HandleIncrement(
                                  'Increment',
                                  cartProduct.productId._id,
                                )
                              }
                              className="mobile:text-[10px] tablet:text-[16px] laptop:text-[16px]  computer:text-[16px] cursor-pointer font-bold border border-black/30 mobile:w-[30px] mobile:h-[30px] tablet:w-10 tablet:h-10 laptop:w-[45px] laptop:h-[45px] computer:w-[45px] computer:h-[45px] flex items-center justify-center"
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <h4 className="mobile:text-[10px] tablet:text-[16px] laptop:text-[16px]  computer:text-[16px] font-bold font-nunito text-[#1e293b] tablet:flex tablet:items-center tablet:gap-1 laptop:flex laptop:items-center laptop:gap-1 computer:flex computer:items-center computer:gap-1">
                            {cartProduct.singleSubtotal}
                            <span className="mobile:hidden tablet:block laptop:block computer:block">
                              ৳
                            </span>
                          </h4>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mobile:p-2 tablet:p-[15px] laptop:p-[15px] computer:p-[15px] mt-[30px] border-t border-black/30">
                  <input
                    className="text-[16px] font-nunito font-normal text-[#1e293b] border border-black/30 h-10 p-[5px] focus:outline-dotted focus:outline-black/30 mobile:w-[150px] tablet:w-[200px] laptop:w-[230px] computer:w-[230px]"
                    type="text"
                    placeholder="Coupon code..."
                  />
                  <button className="mobile:text-[12px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-bold font-nunito text-[#1e293b] cursor-pointer bg-[#f1a31c] mobile:py-2.5 mobile:px-5 tablet:py-2.5 tablet:px-7 laptop:py-2.5 laptop:px-7 computer:py-2.5 computer:px-7 rounded-md hover:bg-[#4169e1] hover:text-[#FFF] ease-in-out duration-300 ml-5">
                    Apply Coupon
                  </button>
                </div>
              </div>
              {(cartData?.length > 0 ||
                Object.keys(SummeryData || {})?.length > 0) && (
                <div className="border border-black/30 px-2.5 mobile:w-full tablet:w-full laptop:w-[47%] computer:w-[47%] mobile:float-none tablet:float-none laptop:float-right computer:float-right ">
                  <div className="border-b border-black/30 p-5 bg-[#fbfbfb]">
                    <h4 className="mobile:text-[15px] tablet:text-[20px] laptop:text-[30px] computer:text-[30px] font-nunito font-bold text-[#1e293b]">
                      Cart totals
                    </h4>
                  </div>
                  <div className="flex items-center justify-between border-b border-black/30 p-2.5">
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-nunito font-bold text-[#1e293b]">
                      Subtotal
                    </h4>
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-nunito font-bold text-[#1e293b]">
                      {SummeryData?.subTotal || 0}৳
                    </h4>
                  </div>
                  <div className="flex items-center justify-between border-b border-black/30 p-2.5">
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-bold font-nunito text-[#1e293b]">
                      Shipping
                    </h4>
                    <div className="my-2.5">
                      <CheckBox
                        label={`ঢাকার ভিতরে: ${
                          Selectpayment === 'insideDhaka'
                            ? SummeryData?.shippingCost || 0
                            : 0
                        }.00৳ `}
                        checked={Selectpayment === 'insideDhaka'}
                        className="rounded-full mb-2.5"
                        onChange={() => handlePaymentChange('insideDhaka')}
                      />

                      <CheckBox
                        label={`ঢাকার বাহিরে: ${
                          Selectpayment === 'outsideDhaka'
                            ? SummeryData?.shippingCost || 0
                            : 0
                        }.00৳ `}
                        checked={Selectpayment === 'outsideDhaka'}
                        className="rounded-full"
                        onChange={() => handlePaymentChange('outsideDhaka')}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-black/30 p-2.5">
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-bold font-nunito text-[#1e293b]">
                      Total
                    </h4>
                    <h4 className="mobile:text-[14px] tablet:text-[16px] laptop:text-[16px] computer:text-[16px] font-bold font-nunito text-[#1e293b]">
                      {SummeryData?.totalPrice || 0}৳
                    </h4>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="mobile:text-[16px] tablet:text-[16px] laptop:text-[18px] computer:text-[18px] font-nunito font-bold text-[#1e293b] bg-[#f1a31c] mobile:py-3.5 tablet:py-[18px] laptop:py-[18px] computer:py-[18px] w-full hover:text-[#FFF] hover:bg-[#4169e1] ease-in-out duration-300 mt-5 rounded-md mb-[30px] cursor-pointer"
                  >
                    Proceed to checkout
                  </button>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}
    </>
  );
};

export default page;
