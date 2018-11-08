const mapKeys = require('lodash/mapKeys');
const identity = require('lodash/identity');
const FormData = require('form-data');

// Don't load node-fetch if fetch is already defined globally (eg React Native)
let Response = global.Response;
let Headers = global.Headers;
if (! Response || ! Headers) {
  const nodeFetch = require('node-fetch');
  Response = nodeFetch.Response;
  Headers = nodeFetch.Headers;
}

/**
 * A Fetch WebAPI implementation based on the Axios client
 */
async function axiosFetch (axios, transfomer, input, init = {}) {
  // Convert the `fetch` style arguments into a Axios style config
  transfomer = transfomer || identity;

  const lowerCasedHeaders = mapKeys(init.headers, function (value, key) {
    return key.toLowerCase();
  });

  if (!('content-type' in lowerCasedHeaders)) {
    lowerCasedHeaders['content-type'] = 'text/plain;charset=UTF-8';
  }

  const config = transfomer({
    url: input,
    method: init.method || 'GET',
    data: init.body instanceof FormData ? init.body : String(init.body),
    headers: lowerCasedHeaders,
    validateStatus: () => true
  }, input, init);

  const result = await axios.request(config);

  // Convert the Axios style response into a `fetch` style response
  const responseBody = typeof result.data === `object` ? JSON.stringify(result.data) : result.data;

  const headers = new Headers();
  Object.entries(result.headers).forEach(function ([key, value]) {
    headers.append(key, value);
  });

  return new Response(responseBody, {
    status: result.status,
    statusText: result.statusText,
    headers
  });
}

function buildAxiosFetch (axios, transformer) {
  return axiosFetch.bind(undefined, axios, transformer);
}

module.exports = {
  buildAxiosFetch
};
