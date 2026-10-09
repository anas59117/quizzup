import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { GameFeelProvider } from './GameFeelProvider';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught QuizzUp UI error', error, info);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <main className="fatal-ui" role="alert">
        <h1>QuizzUp</h1>
        <p>Une erreur inattendue est survenue. / Something went wrong.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Réessayer / Retry
        </button>
      </main>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nProvider>
      <GameFeelProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </GameFeelProvider>
    </I18nProvider>
  </React.StrictMode>
);
