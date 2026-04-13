const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy all /api/* requests to the API Gateway running in Docker
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );

  // Proxy WebSocket connections to the notification service
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:8084',
      changeOrigin: true,
      ws: true,
    })
  );
};
