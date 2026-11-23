import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { config } from 'dotenv';

config({ path: '.env' });

const dev = process.env.NODE_ENV !== 'production' && process.env.COZE_PROJECT_ENV !== 'PROD';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app (不要传 hostname，让 Next.js 使用请求的 Host 头)
const app = next({ dev, port, dir: process.cwd() });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(
      `> Server listening on port ${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
  });
});
