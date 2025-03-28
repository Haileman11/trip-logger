import { FaTruck } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthUser } from "../store/slices/authSlice";

const Navigation = () => {
  const user = useSelector(selectAuthUser);

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FaTruck className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                TruckLogger
              </span>
            </Link>
            {user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/logs"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Logs
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm font-medium">
                  {user.first_name} {user.last_name}
                </span>
                {/* <Link
                  to="/logout"
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Logout
                </Link> */}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    // <nav className="bg-white shadow">
    //   <div className="max-w-7xl mx-auto px-4">
    //     <div className="flex justify-between h-16">
    //       <div className="flex">
    //         <div className="flex-shrink-0 flex items-center">
    //           <Link to="/" className="text-xl font-bold text-primary-600">
    //             Trip Logger
    //           </Link>
    //         </div>
    //         <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
    //           <Link
    //             to="/"
    //             className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    //           >
    //             Dashboard
    //           </Link>
    //           <Link
    //             to="/trip-details"
    //             className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    //           >
    //             New Trip
    //           </Link>
    //           <Link
    //             to="/logs"
    //             className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    //           >
    //             Log Sheets
    //           </Link>
    //           <Link
    //             to="/daily-log"
    //             className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    //           >
    //             Daily Log
    //           </Link>
    //         </div>
    //       </div>
    //       <div className="flex items-center">
    //         <Link
    //           to="/profile"
    //           className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    //         >
    //           Profile
    //         </Link>
    //         <button
    //           className="ml-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
    //           onClick={() => {
    //             // TODO: Implement logout
    //             console.log('Logout clicked');
    //           }}
    //         >
    //           Logout
    //         </button>
    //       </div>
    //     </div>
    //   </div>
    // </nav>
  );
};

export default Navigation;
