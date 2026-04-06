import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Search from './pages/Search'
import Category from './pages/Category'
import ProDetail from './pages/ProDetail'
import Request from './pages/Request'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Community from './pages/Community'
import Market from './pages/Market'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/category/:id" element={<Category />} />
          <Route path="/pro/:id" element={<ProDetail />} />
          <Route path="/request" element={<Request />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/community" element={<Community />} />
          <Route path="/market" element={<Market />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
