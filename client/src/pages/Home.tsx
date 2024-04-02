import { useContext, useState } from "react";

// context
import { GlobalStateContext } from "@/context/GlobalContext";
import Round from "@/components/Round";
import { Link } from "react-router-dom";

const Home = () => {
  const { hasInteractiveParams, isAdmin, backendAPI } = useContext(GlobalStateContext);

  // if (!backendAPI) return <div />;

  return (
      <div className="flex flex-col items-center">
        {isAdmin && (
          <Link
            to={"/admin"}
            className="border rounded-full flex self-start items-center justify-center p-1 hover:bg-[#f3f5f6] transition-colors mb-2"
          >
            <i className="icon settings-icon h-6 w-6" />
          </Link>
        )}
        <img src="/bg.png" alt="background" className="w-80 h-44 rounded-3xl object-cover" />
        <h1 className="h2 !mt-6 !mb-2 !font-semibold text-center">Breakout</h1>
        <p className="p1 text-center">A fun speed networking experience.</p>
        <div className="my-12 w-full">
          <Round />
        </div>
        <button className="btn btn-enhanced fixed bottom-5 !w-80">Start Breakout</button>
      </div>
  );
};

export default Home;
