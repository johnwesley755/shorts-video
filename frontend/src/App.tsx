import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Create from './pages/Create';
import Library from './pages/Library';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </Layout>
  );
}

export default App;
