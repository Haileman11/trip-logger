import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Navigation from './components/Navigation';
import RouteAndELDLogDisplay from './pages/RouteAndELDLogDisplay';
import LiveTripExecution from './pages/LiveTripExecution';
import TripCompletionReport from './pages/TripCompletionReport';
import TripDetails from './components/TripDetails';
import LogSheet from './pages/LogSheet';
import LogViewer from './pages/LogViewer';
import TripPlanner from './pages/TripPlanner';
import TripList from './components/TripList';
import DailyLogGrid from './components/DailyLogGrid';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import TripExecution from './pages/TripExecution';

const AppContent: React.FC = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-gray-100">
      { <Navigation />}
      <main className={showNavigation ? "container mx-auto px-4 py-8" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<TripList />} />
          <Route path="/trip/new" element={<TripPlanner />} />              
          <Route path="/route-display" element={<RouteAndELDLogDisplay />} />
          <Route path="/live-trip" element={<LiveTripExecution />} />
          <Route path="/trip-completion" element={<TripCompletionReport />} />
          <Route path="/trip/:tripId" element={<TripDetails />} />
          <Route path="/trip/:tripId/log-sheets" element={<LogViewer />} />
          <Route path="/trip/:tripId/log-sheet/:id" element={<LogSheet />} />
          <Route path="/trip/:tripId/log-sheet/new" element={<LogSheet />} />
          <Route path="/daily-log" element={<DailyLogGrid 
            date={{
              month: "04",
              day: "09",
              year: "2021"
            }}
            totalMilesDriving={350}
            vehicleNumbers="123, 20544"
            carrierName="John Doe's Transportation"
            carrierAddress="Washington, D.C."
            driverName="John E. Doe"
            remarks={[
              { time: "04:00", location: "Richmond, VA" },
              { time: "07:00", location: "Fredericksburg, VA" },
              { time: "10:00", location: "Baltimore, MD" },
              { time: "13:00", location: "Philadelphia, PA" },
              { time: "16:00", location: "Cherry Hill, NJ" },
              { time: "19:00", location: "Newark, NJ" }
            ]}
            dutyStatusChanges={[
              { time: "00:00", status: "offDuty", location: "Start" },
              { time: "04:00", status: "driving", location: "Richmond" },
              { time: "06:00", status: "onDuty", location: "Break" },
              { time: "07:00", status: "driving", location: "Resume" },
              { time: "10:00", status: "onDuty", location: "Baltimore" },
              { time: "11:00", status: "driving", location: "Resume" },
              { time: "13:00", status: "sleeper", location: "Philadelphia" },
              { time: "15:00", status: "driving", location: "Resume" },
              { time: "17:00", status: "onDuty", location: "Break" },
              { time: "18:00", status: "driving", location: "Resume" },
              { time: "20:00", status: "offDuty", location: "End" }
            ]}
          />} />
          <Route path="/signup" element={<SignUp onSignUp={() => {}} />} />
          <Route path="/login" element={<Login  />} />
          <Route path="/trip/:tripId/live" element={<TripExecution/>} />
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
