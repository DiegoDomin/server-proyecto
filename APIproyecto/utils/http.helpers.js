const { parse } = require("url");

async function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(JSON.parse(body)));
    req.on("error", (err) => reject(err));
  });
}

function sendJsonResponse(res, statusCode, data) {
  if (!res || typeof res.writeHead !== "function" || typeof res.end !== "function") {
    console.error("Error: Response object is not valid.");
    return;
  }
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

module.exports = { parseRequestBody, sendJsonResponse };
