import { useContext, useState } from "react";

// context
import { GlobalStateContext } from "@/context/GlobalContext";
import Round from "@/components/Round";
import { Link } from "react-router-dom";
import AdminControls from "@/components/AdminControls";
import DottedLoader from "@/components/DottedLoader";

const Home: React.FC = () => {
  const { hasInteractiveParams, isAdmin, backendAPI, initLoading } = useContext(GlobalStateContext);

  // if (!backendAPI) return <div />;

  return (
    <div className="flex flex-col items-center justify-start w-full h-full">
      {initLoading ? (
        <DottedLoader />
      ) : (
        <>
          {isAdmin && <AdminControls />}
          <img src="/bg.png" alt="background" className="w-80 h-44 rounded-3xl object-cover" />
          <h1 className="h2 !mt-6 !mb-2 !font-semibold text-center">Breakout</h1>
          <p className="p1 text-center">A fun speed networking experience.</p>
          <div className="my-12 w-full">
            <Round />
          </div>
          <button className="btn btn-enhanced w-full">Start Breakout</button>
        </>
      )}
    </div>
  );
};

export default Home;
