const { json } = require('express');
const promiseAny = require('promise-any');
const logger = require('pino')({ useLevelLabels: true });

const openApiPaths = ['openapi/v2', 'swagger.json'];

// execute parallel requests to possible open api endpoints and return first success
module.exports = async function getOpenApiSpec(url, token) {
  const { got } = await import('got');
  let gotProms = [];
  for (let p of openApiPaths) {
    const gotProm = await got(p, {
      prefixUrl: url,
      responseType: 'json',
      timeout: { request: 5000 },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(r => {
        logger.info(
          { url, path: p },
          'successfully retrieved open api spec from this path'
        );
        return r.body;
      })
      .catch(err => {
        if (err.response && err.response.statusCode === 404) {
          logger.info(
            { cause: err.message, url, path: p },
            'failed to retrieve open api spec from this path - will try another'
          );
          return null;
        } else {
          throw err;
        }
      });
    gotProms.push(gotProm);
  }
  return promiseAny(gotProms);
};
