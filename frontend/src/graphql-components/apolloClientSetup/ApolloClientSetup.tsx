import { getMainDefinition } from '@apollo/client/utilities';
import { ApolloProvider } from '@apollo/react-hooks';
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  split,
  InMemoryCache,
} from '@apollo/client';
import { FC, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { VITE_APP_CROWNLABS_GRAPHQL_URL } from '../../env';
import { hasRenderingError } from '../../errorHandling/utils';
import { ErrorContext } from '../../errorHandling/ErrorContext';
import { useAuth } from 'react-oidc-context';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { WebSocketLink } from '@apollo/client/link/ws';

const httpUri = VITE_APP_CROWNLABS_GRAPHQL_URL;
const wsUri = httpUri.replace(/^http?/, 'ws') + '/subscription';
export interface Definition {
  kind: string;
  operation?: string;
}

const ApolloClientSetup: FC<PropsWithChildren> = props => {
  const { children } = props;
  const auth = useAuth();
  const token = auth.user?.id_token;

  const { errorsQueue } = useContext(ErrorContext);
  const [apolloClient, setApolloClient] = useState<ApolloClient<unknown>>();

  useEffect(() => {
    if (!auth?.isAuthenticated && !auth?.isLoading) {
      auth?.signinRedirect().then(console.log).catch(console.error);
    }
  }, [auth]);

  useEffect(() => {
    if (token) {
      const httpLink = new HttpLink({
        uri: httpUri,
        headers: {
          authorization: token ? `Bearer ${token}` : '',
        },
      });

      const wsLink = new WebSocketLink(
        new SubscriptionClient(wsUri, {
          reconnect: true,
          connectionParams: {
            authorization: token ? `Bearer ${token}` : '',
          },
        }),
      );

      const terminatingLink = split(
        ({ query }) => {
          const { kind, operation }: Definition = getMainDefinition(query);
          // If this is a subscription query, use wsLink, otherwise use httpLink
          return kind === 'OperationDefinition' && operation === 'subscription';
        },
        wsLink,
        httpLink,
      );

      const link = ApolloLink.from([terminatingLink]);

      setApolloClient(
        new ApolloClient({
          link,
          cache: new InMemoryCache(),
        }),
      );
    }
  }, [token]);
  return (
    <>
      {(auth.isAuthenticated || hasRenderingError(errorsQueue)) && apolloClient && (
        <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
      )}
    </>
  );
};

export default ApolloClientSetup;
