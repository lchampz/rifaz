import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CreateRafflePage from './pages/CreateRafflePage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyTicketsPage from './pages/MyTicketsPage';
import RaffleDetailPage from './pages/RaffleDetailPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <main className='container mx-auto px-4 py-8'>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/raffle/:id' element={<RaffleDetailPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />

          {/* Rotas protegidas */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/create-raffle'
            element={
              <ProtectedRoute>
                <CreateRafflePage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/my-tickets'
            element={
              <ProtectedRoute>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
