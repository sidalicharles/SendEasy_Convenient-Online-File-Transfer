import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import Index from './pages/Index';

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </HashRouter>
    <Toaster />
  </ThemeProvider>
);

export default App;