const { app, session } = require('electron');
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const P12_PASSWORD = 'campus';

/** @returns {string} */
const resolveCertsDir = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'certs');
  }
  return path.resolve(__dirname, '../../server/certs');
};

/** @returns {import('crypto').X509Certificate | null} */
const loadCampusCa = () => {
  const caPath = path.join(resolveCertsDir(), 'ca.crt');
  if (!fs.existsSync(caPath)) return null;
  return new X509Certificate(fs.readFileSync(caPath));
};

/**
 * @param {Electron.Certificate} certificate
 * @param {import('crypto').X509Certificate | null} caCert
 */
const isIssuedByCampusCa = (certificate, caCert) => {
  if (!caCert || !certificate?.data) return false;
  try {
    const serverCert = new X509Certificate(certificate.data);
    return serverCert.checkIssued(caCert);
  } catch {
    return false;
  }
};

const tryImportClientP12 = () => {
  const p12Path = path.join(resolveCertsDir(), 'client.p12');
  if (!fs.existsSync(p12Path)) {
    console.warn('[CAMPUS] [mTLS] client.p12 em falta — corre: node server/scripts/import-client-p12.mjs');
    return;
  }

  try {
    if (process.platform === 'win32') {
      execSync(`certutil -f -user -p ${P12_PASSWORD} -importpfx "${p12Path}"`, { stdio: 'pipe' });
      console.log('[CAMPUS] [mTLS] client.p12 importado (Windows).');
      return;
    }

    if (process.platform === 'darwin') {
      const keychain = path.join(os.homedir(), 'Library/Keychains/login.keychain-db');
      execSync(
        `security import "${p12Path}" -k "${keychain}" -P ${P12_PASSWORD} -A -T /usr/bin/security`,
        { stdio: 'pipe' },
      );
      console.log('[CAMPUS] [mTLS] client.p12 importado (macOS Keychain).');
      return;
    }

    if (process.platform === 'linux') {
      const nssDb = path.join(os.homedir(), '.pki', 'nssdb');
      if (!fs.existsSync(nssDb)) {
        fs.mkdirSync(nssDb, { recursive: true });
        execSync(`certutil -d sql:${nssDb} -N --empty-password`, { stdio: 'pipe' });
      }
      execSync(`pk12util -i "${p12Path}" -d sql:${nssDb} -W ${P12_PASSWORD}`, { stdio: 'pipe' });
      console.log('[CAMPUS] [mTLS] client.p12 importado (Linux NSS).');
      return;
    }

    console.warn(
      '[CAMPUS] [mTLS] Importa client.p12 manualmente: node server/scripts/import-client-p12.mjs',
    );
  } catch {
    console.warn(
      '[CAMPUS] [mTLS] Não foi possível importar client.p12 automaticamente. ' +
        'Corre: node server/scripts/import-client-p12.mjs',
    );
  }
};

/**
 * @param {import('electron').Session} ses
 */
const installCampusTls = (ses) => {
  const caCert = loadCampusCa();

  ses.setCertificateVerifyProc((request, callback) => {
    const host = request.hostname ?? '';

    if (host !== 'localhost' && host !== '127.0.0.1') {
      callback(-3);
      return;
    }

    if (caCert && isIssuedByCampusCa(request.certificate, caCert)) {
      callback(0);
      return;
    }

    if (!caCert) {
      console.warn('[CAMPUS] [mTLS] ca.crt em falta no bundle — verificação TLS limitada.');
      callback(0);
      return;
    }

    console.warn(
      `[CAMPUS] [mTLS] Certificado do servidor rejeitado para ${host} — não assinado pela CA-CAMPUS.`,
    );
    callback(-2);
  });
};

const registerClientCertificateHandler = () => {
  app.on('select-client-certificate', (event, _webContents, url, list, callback) => {
    if (!String(url).includes('localhost') && !String(url).includes('127.0.0.1')) return;

    event.preventDefault();

    const preferred = list.find(
      (cert) =>
        cert.subjectName?.toLowerCase().includes('campus') ||
        cert.issuerName?.toLowerCase().includes('campus'),
    );

    if (preferred) {
      callback(preferred);
      return;
    }

    if (list.length > 0) {
      callback(list[0]);
      return;
    }

    console.warn(
      '[CAMPUS] [mTLS] Certificado de cliente necessário. ' +
        'Corre: node server/scripts/import-client-p12.mjs',
    );
    callback();
  });
};

const setupCampusTls = () => {
  tryImportClientP12();
  registerClientCertificateHandler();
  installCampusTls(session.defaultSession);
};

module.exports = { setupCampusTls, resolveCertsDir, P12_PASSWORD };
