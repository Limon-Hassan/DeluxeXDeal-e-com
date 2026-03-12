import React from "react";
import { Outlet } from "react-router-dom";
import { SideBer } from "./Sideber";
import Navber from "./Navber";
const Rootleayout = () => {
  return (
    <div className="sm:flex sm:flex-col desktop:flex desktop:flex-row h-screen w-full">
      <aside className="bg-gray-800">
        <SideBer />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="bg-white shadow">
          <Navber />
        </header>

        <main className="flex-1 overflow-auto bg-gray-100 sm:p-0 desktop:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Rootleayout;
