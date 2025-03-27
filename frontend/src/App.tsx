import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Navigation from "./components/Navigation";
// import TripDetails from "./components/TripDetails";
import TripDetails from "./pages/TripDetails";
import LogViewer from "./pages/LogViewer";
import TripPlanner from "./pages/TripPlanner";

import { SignUp } from "./pages/SignUp";
import { Login } from "./pages/Login";
import  LandingPage  from "./pages/LandingPage";
import TripExecution from "./pages/TripExecution";
import TripsList from "./pages/TripsList";
import LogsList from "./pages/LogsList";
import DailyLogViewer from "./pages/DailyLogViewer";

const AppContent: React.FC = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== "/";

  return (
    <div className="min-h-screen bg-gray-100">
      {<Navigation />}
      <main className={showNavigation ? "container mx-auto px-4 py-8" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<TripsList />} />
          
          <Route path="/trip/new" element={<TripPlanner />} />
          <Route path="/trip/:tripId" element={<TripDetails />} />
          <Route path="/trip/:tripId/log-sheets" element={<LogViewer />} />
          <Route path="/trip/:tripId/live" element={<TripExecution />} />
          <Route path="/logs" element={<LogsList />} />
          <Route path="/logs/:date" element={<DailyLogViewer />} />
          
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
