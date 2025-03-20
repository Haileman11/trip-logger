import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import TripPlanner from './pages/TripPlanner';
import LogSheet from './pages/LogSheet';
import LogViewer from './pages/LogViewer';
import Navigation from './components/Navigation';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<TripPlanner />} />
              <Route path="/logs" element={<LogViewer />} />
              <Route path="/log-sheet/:id" element={<LogSheet />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
