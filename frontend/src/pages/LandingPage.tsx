import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaClock, FaMapMarkerAlt, FaMapMarkedAlt, FaChartLine, FaLocationArrow } from 'react-icons/fa';
import { BsBuilding } from 'react-icons/bs';
import { Card } from '@/components/ui/card';

const LandingPage: React.FC = () => {
 
  return (
    <div className="min-h-screen bg-white grid gap-12">
      {/* Navigation */}

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto ">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Simplify Your Trucking</span>
                    <span className="block text-blue-600">Logs & Route Planning</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Automate your ELD logs and get optimized routes with our intelligent trucking solution.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link to="/signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                        Get Started
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link to="/trip/new" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                        Watch Demo
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                  <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                    <img className="w-full" src="/dashboard-preview.webp" alt="Dashboard Preview" />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className=" bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Everything You Need in One Place</h2>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 ">
              <Card className="flex flex-col items-center p-10">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <FaMapMarkerAlt className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Smart Route Planning</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Optimize your routes with real-time traffic updates and rest stop recommendations.
                </p>
              </Card>

              <Card className="flex flex-col items-center p-10">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <BsBuilding className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Automated ELD Logs</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Automatically generate and maintain compliant electronic logging device records.
                </p>
              </Card>

              <Card className="flex flex-col items-center p-10">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <FaClock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Hours Tracking</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Monitor driving hours and receive alerts for required rest periods.
                </p>
              </Card>
              
              <Card className="flex flex-col items-center p-10">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <FaLocationArrow className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Real-time Tracking</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Monitor vehicle location and progress in real-time with our interactive map interface.
                </p>
              </Card>
              
            </div>
          </div>
        </div>
      </div>

      {/* Route Planner Demo */}
      

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center">
                <FaTruck className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">TruckLogger</span>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Simplifying trucking operations with smart technology.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><Link to="#features" className="text-base text-gray-300 hover:text-white">Features</Link></li>
                <li><Link to="https://github.com/Haileman11/trip-logger" className="text-base text-gray-300 hover:text-white">Documentation</Link></li>
                </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><Link to="https://github.com/Haileman11/trip-logger" className="text-base text-gray-300 hover:text-white">Help Center</Link></li>

                <li><Link to="https://github.com/Haileman11" className="text-base text-gray-300 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><Link to="https://www.fmcsa.dot.gov/regulations/hours-of-service" className="text-base text-gray-300 hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              © 2025 TruckLogger. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;