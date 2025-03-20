import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import TripPlanner from './pages/TripPlanner';
import LogViewer from './pages/LogViewer';
import Navbar from './components/Navbar';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<TripPlanner />} />
              <Route path="/logs" element={<LogViewer />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
