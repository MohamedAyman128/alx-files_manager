import express from 'express';
import router from './routes/index';
import unmatchedRouteHandler from './middleware/unmatched';
import errorHandler from './middleware/error';
import shutdown from './utils/shutdown';

// Express server
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);
app.use(unmatchedRouteHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const handler = () => shutdown(server);
process.on('SIGINT', handler);
process.on('SIGTERM', handler);
process.on('SIGQUIT', handler);

export default app;
