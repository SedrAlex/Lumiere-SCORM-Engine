import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {
  createMemoryHistory,
  createBrowserHistory,
  Update,
  InitialEntry,
  BrowserHistory,
} from 'history';

// Define the type for the options parameter
interface MountOptions {
  onNavigate?: (update: Update) => void; // Update type to match history.listen
  defaultHistory?: BrowserHistory;
  initialPath?: string;
}

// Define the type for the return value of the mount function
interface MountReturn {
  onParentNavigate?: (nextPathname: string) => void;
}
// Update the mount function to use the type
const mount = (
  el: Element,
  { onNavigate, defaultHistory, initialPath }: MountOptions = {},
): MountReturn => {
  if (!el) return {};

  // Create a memory history instance and check fo activating  browser history  for only micro frontend
  const history =
    defaultHistory ||
    createMemoryHistory({
      initialEntries: [initialPath as InitialEntry],
    });

  //trigger when change the current path from the shell
  function onParentNavigate(nextPathname: string) {
    const { pathname } = history.location;
    if (pathname !== nextPathname) {
      history.push(nextPathname);
    }
  }
  // Set up the navigation listener
  if (onNavigate) {
    history.listen(onNavigate);
  }

  // Create the root for the React application
  const root = ReactDOM.createRoot(el);

  // Render the App component with the custom history
  root.render(<App  />);

  return {
    onParentNavigate: onParentNavigate,
  };
};

// Development environment setup
if (process.env.NODE_ENV === 'development') {
  const devRoot = document.querySelector('#procurement-root');
  if (devRoot) {
    mount(devRoot, { defaultHistory: createBrowserHistory() });
  }
}

export { mount };
