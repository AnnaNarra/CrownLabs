import React from 'react';
import ReactDOM from 'react-dom/client';
import './theming';
import App from './App';
import ApolloClientSetup from './graphql-components/apolloClientSetup/ApolloClientSetup';
import TenantContextProvider from './contexts/TenantContext';
import ErrorContextProvider from './errorHandling/ErrorContext';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import {
  VITE_APP_CROWNLABS_OIDC_AUTHORITY,
  VITE_APP_CROWNLABS_OIDC_CLIENT_ID,
} from './env';

const oidcConfig: AuthProviderProps = {
  authority: VITE_APP_CROWNLABS_OIDC_AUTHORITY,
  client_id: VITE_APP_CROWNLABS_OIDC_CLIENT_ID,
  loadUserInfo: true,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: 'https://crownlabs.polito.it/',
  automaticSilentRenew: true,
  scope: 'openid profile email api',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorContextProvider>
      <AuthProvider {...oidcConfig}>
        <ApolloClientSetup>
          <TenantContextProvider>
            <App />
          </TenantContextProvider>
        </ApolloClientSetup>
      </AuthProvider>
    </ErrorContextProvider>
  </React.StrictMode>,
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
