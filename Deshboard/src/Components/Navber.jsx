import React, { useState } from "react";
import { SideBer } from "./Sideber";
import { FaBars } from "react-icons/fa6";


const Navber = () => {
  let [sidebar, setSidebar] = useState(false);

  return (
    <>
      <nav className="w-full bg-white p-4 py-[20px] shadow-xl shadow-black/30">
        <div className="sm:mx-0  sm:px-5 desktop:mx-auto desktop:max-w-[1400px] desktop:px-0">
          <div className="items-center sm:flex sm:w-fit sm:justify-normal sm:gap-3 desktop:flex desktop:w-full desktop:justify-between">
            <button
              onClick={() => setSidebar(!sidebar)}
              className="h-[50px] w-[50px] items-center justify-center rounded-md bg-white shadow-md sm:flex desktop:hidden"
            >
              <FaBars className="h-6 w-6 text-gray-600" />
            </button>
            <div className="relative h-[50px] rounded-full border-2 border-black/50 sm:w-[230px] desktop:w-[750px]">
              <input
                className="h-full w-full rounded-full pl-5 pr-[90px] outline-none"
                placeholder="Search Here..."
                type="text"
              />
              <span className="absolute right-[20px] top-[50%] flex translate-y-[-50%] cursor-pointer items-center justify-center rounded-full bg-blue-gray-500/20 px-[10px] py-[10px] text-[20px]">
                <i class="fa-solid fa-magnifying-glass text-black"></i>
              </span>
            </div>
            <div className="flex gap-5">
              <span className="cursor-pointer items-center justify-center rounded-full bg-blue-gray-500/20 px-[14px] py-[5px] text-[24px] sm:hidden desktop:flex">
                <i class="fa-light fa-bell text-black"></i>
              </span>
              <span className="cursor-pointer items-center justify-center rounded-full bg-blue-gray-500/20 px-[14px] py-[5px] text-[24px] sm:hidden desktop:flex">
                <i class="fa-light fa-message text-black"></i>
              </span>
              <div className="h-[50px] w-[50px] rounded-full border-2 border-red-500 p-[2px]">
                <img
                  className="h-full w-full rounded-full"
                  src="/mans.png"
                  alt="mans"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="desktop:hidden">
        <SideBer sidebar={sidebar} setSidebar={setSidebar} />
      </div>
    </>
  );
};

export default Navber;
