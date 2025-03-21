import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Navigation from './components/Navigation';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import TripPlanner from './pages/TripPlanner';
import LogSheet from './pages/LogSheet';
import LogViewer from './pages/LogViewer';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<TripList />} />
              <Route path="/new-trip" element={<TripPlanner />} />
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
