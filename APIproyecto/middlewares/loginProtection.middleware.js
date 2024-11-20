const failedLogins = {};
const MAX_ATTEMPTS = 5; // Máximo número de intentos antes de aplicar el retraso máximo
const BASE_DELAY = 1000; // 1 segundo de base para el retraso

const trackFailedLogin = (ip) => {
  if (!failedLogins[ip]) {
    failedLogins[ip] = { attempts: 0, lastAttempt: null };
  }

  failedLogins[ip].attempts += 1;
  failedLogins[ip].lastAttempt = Date.now();

};

const getDelayTime = (ip) => {
  const attempts = failedLogins[ip]?.attempts || 0;
  return Math.min(BASE_DELAY * Math.pow(2, attempts - 1), BASE_DELAY * MAX_ATTEMPTS);
};

const resetFailedLogins = (ip) => {
  delete failedLogins[ip];
};

const applyDelay = async (ip) => {
  const delayTime = getDelayTime(ip);

  return new Promise((resolve) => setTimeout(resolve, delayTime));
};

module.exports = { trackFailedLogin, resetFailedLogins, applyDelay };
