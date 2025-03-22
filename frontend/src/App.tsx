import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<TripList />} />
              <Route path="/trip/new" element={<TripPlanner />} />              
              <Route path="/route-display" element={<RouteAndELDLogDisplay />} />
              <Route path="/live-trip" element={<LiveTripExecution />} />
              <Route path="/trip-completion" element={<TripCompletionReport />} />
              <Route path="/trip/:tripId" element={<TripDetails />} />
              <Route path="/trip/:tripId/log-sheets" element={<LogViewer />} />
              <Route path="/trip/:tripId/log-sheet/:id" element={<LogSheet />} />
              <Route path="/trip/:tripId/log-sheet/new" element={<LogSheet />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
