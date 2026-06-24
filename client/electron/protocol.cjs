const { net, protocol } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SCHEME = 'campus';

/** Tem de correr antes de app.whenReady(). */
const registerCampusScheme = () => {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
};

const resolveDistRoot = () => path.join(__dirname, '../dist');

const resolveDistFile = (urlPathname) => {
  const distRoot = path.resolve(resolveDistRoot());
  let relative = decodeURIComponent(urlPathname);
  if (relative.startsWith('/')) relative = relative.slice(1);
  if (!relative || relative === '.') relative = 'index.html';

  const filePath = path.normalize(path.join(distRoot, relative));
  if (!filePath.startsWith(distRoot)) return null;
  return filePath;
};

/** Serve ficheiros de dist/ — evita ecrã em branco com file:// + crossorigin do Vite. */
const installCampusProtocol = async () => {
  const distRoot = resolveDistRoot();
  if (!fs.existsSync(distRoot)) {
    console.warn('[CAMPUS] dist/ em falta — protocolo campus:// pode falhar.');
  }

  await protocol.handle(SCHEME, (request) => {
    const url = new URL(request.url);
    const filePath = resolveDistFile(url.pathname);
    if (!filePath || !fs.existsSync(filePath)) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).href);
  });
};

const campusAppUrl = (hashRoute = '/login') => {
  const hash = hashRoute.startsWith('/') ? hashRoute : `/${hashRoute}`;
  return `${SCHEME}://./index.html#${hash}`;
};

module.exports = {
  SCHEME,
  registerCampusScheme,
  installCampusProtocol,
  campusAppUrl,
  resolveDistRoot,
};
