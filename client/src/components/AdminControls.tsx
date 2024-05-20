import { NavLink } from "react-router-dom";

const AdminControls: React.FC = () => {
  return (
    <div className="flex w-full flex-col items-center justify-center mb-6">
      <div className="flex w-full items-center justify-center border rounded-lg py-1">
        <NavLink
          end
          to={"/"}
          className={({ isActive }) => {
            return `p-2 transition-colors rounded-lg mx-1 w-1/2 flex items-center justify-center ${isActive ? "bg-[#0a2540] hover:bg-[#3b5166] text-white" : "bg-white text-[#0a2540]"}`;
          }}
        >
          Home
        </NavLink>
        <NavLink
          end
          to={"/admin"}
          className={({ isActive }) => {
            return `p-2 transition-colors rounded-lg mx-1 w-1/2 flex items-center justify-center ${isActive ? "bg-[#0a2540] hover:bg-[#3b5166] text-white" : "bg-white text-[#0a2540]"}`;
          }}
        >
          Admin
        </NavLink>
      </div>
    </div>
  );
};

export default AdminControls;
