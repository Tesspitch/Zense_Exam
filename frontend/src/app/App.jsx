import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes'; // อยู่ระดับเดียวกัน ใช้ ./ ได้เลย
import { ThemeProvider } from '../context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <main>
          <AppRoutes /> 
        </main>
      </Router>
    </ThemeProvider>
  );
}

export default App;