import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  BaseException,
  InternalServerErrorException,
} from 'lib/exceptions/http';
import { pick } from 'lib/utils/utils';
import { router } from './routes';

// Init
export const app = new OpenAPIHono();

// Exceptions
app.notFound((c) => c.json({ success: false, message: 'No Such Route' }, 404));
app.onError((err, c) => {
  if (err instanceof BaseException) {
    if (err instanceof InternalServerErrorException) {
      console.error(err);
    }

    return c.json(
      { success: false, ...pick(err, ['message', 'errorType', 'details']) },
      err.statusCode
    );
  }

  // Default to 500 for unknown errors
  console.error(err);
  return c.json({ success: false, message: err.message }, 500);
});

// Routes
app.route('/', router);

// Swagger
app.doc('/docs.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'API Documentation',
  },
  security: [
    {
      userJwtAuth: [],
      adminJwtAuth: [],
      operatorJwtAuth: [],
    },
  ],
});

app.get(
  '/docs',
  swaggerUI({
    url: '/docs.json',
    persistAuthorization: true,
  })
);

export default app;
