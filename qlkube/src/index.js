const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer');
const compression = require('compression');
const dotenv = require('dotenv');
const express = require('express');
const fs = require('fs').promises;
const { printSchema } = require('graphql');
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require('@apollo/server-plugin-landing-page-graphql-playground');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const bodyParser = require('body-parser');
const { useServer } = require('graphql-ws/lib/use/ws');
const logger = require('pino')({ useLevelLabels: true });
const { setupSubscriptions } = require('./decorateSubscription.js');
const getOpenApiSpec = require('./oas');
const { decorateOpenapi } = require('./decorateOpenapi');
const { createSchema } = require('./schema');
const { subscriptions } = require('./subscriptions.js');
const { kinformer } = require('./informer.js');
const {
  getBearerToken,
  graphqlQueryRegistry,
  graphqlLogger,
} = require('./utils.js');

dotenv.config();

main().catch(e =>
  logger.error({ error: e.stack }, 'failed to start qlkube server')
);

async function main() {
  const inCluster = process.env.IN_CLUSTER !== 'false';
  logger.info({ inCluster }, 'cluster mode configured');
  const kubeApiUrl = inCluster
    ? 'https://kubernetes.default.svc'
    : 'http://localhost:8001';
  const inClusterToken = inCluster
    ? await fs.readFile(
        '/var/run/secrets/kubernetes.io/serviceaccount/token',
        'utf8'
      )
    : '';
  const oas = await getOpenApiSpec(kubeApiUrl, inClusterToken);
  const targetOas = decorateOpenapi(oas);
  let schema = await createSchema(targetOas, kubeApiUrl, inClusterToken);
  try {
    schema = setupSubscriptions(subscriptions, schema, kubeApiUrl);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const app = express();
  app.use(compression());
  app.use(bodyParser.json());

  app.get('/schema', (req, res) => {
    res.setHeader('content-type', 'text/plain');
    res.send(printSchema(schema));
  });
  app.get('/healthz', (req, res) => {
    res.sendStatus(200);
  });

  const httpServer = createServer(app);

  const server = new ApolloServer({
    schema,
    playground: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer: httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground(),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: error => {
      try {
        const msgs = [...error.message.match(/(\d+)\s*\-(.*)$/)];
        if (msgs.length != 3) return error;
        let msg = JSON.parse(msgs[2]);
        try {
          msg = JSON.parse(msg);
        } catch (_) {}
        return {
          ...error,
          message: msg.message,
          extensions: {
            ...error.extensions,
            k8s: msg,
            http: msgs[1],
          },
        };
      } catch (e) {
        graphqlLogger('[w] Could not parse error response: ' + e);
        return error;
      }
    },
    subscriptions: {
      path: '/subscription',
      onConnect: (connectionParams, webSocket, context) => {
        graphqlLogger('[i] New connection');
        const token = getBearerToken(connectionParams);
        return { token };
      },
      onDisconnect: (webSocket, context) => {
        graphqlLogger('[i] Disconnected');
      },
    },

    context: async ({ req, connection }) => {
      if (connection) {
        const { token } = connection.context;
        return { token };
      }
      if (!req.headers['apollo-query-plan-experimental']) {
        const token = getBearerToken(req.headers);
        return { token };
      }
    },
  });

  await server.start();

  app.use(
    '/',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = getBearerToken(req.headers);
        return { token };
      },
    })
  );

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions',
  });
  const serverCleanup = useServer({ schema }, wsServer);

  //server.installSubscriptionHandlers(httpServer);

  const PORT = process.env.CROWNLABS_QLKUBE_PORT || 8080;

  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/`);
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${PORT}/subscriptions`
    );
  });

  /**
   * Making informer for watching resources.
   * Whether you want to change informer with watcher:
   * 1. Include kwatch from watch.js
   * 2. Use kwatch(resourceApi, sub.type);
   */
  try {
    subscriptions.forEach(sub => {
      kinformer(sub);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
