import ReactDOM from 'react-dom/client';
import App from './App';

// Note: StrictMode removed to prevent double-mounting issues with Socket.io
// StrictMode causes effects to run twice in development, which interferes with socket listeners
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
