import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes'; // อยู่ระดับเดียวกัน ใช้ ./ ได้เลย

function App() {
  return (
    <Router>
      <main>
        <AppRoutes /> 
      </main>
    </Router>
  );
}

export default App;