/* Bundled with @netlify/blobs so that no install step is needed on Netlify. Source: src/qaqc.mjs */

// node_modules/@netlify/runtime-utils/dist/main.js
var getString = (input) => typeof input === "string" ? input : JSON.stringify(input);
var base64Decode = globalThis.Buffer ? (input) => Buffer.from(input, "base64").toString() : (input) => atob(input);
var base64Encode = globalThis.Buffer ? (input) => Buffer.from(getString(input)).toString("base64") : (input) => btoa(getString(input));
var getEnvironment = () => {
  const { Deno, Netlify, process: process2 } = globalThis;
  return Netlify?.env ?? Deno?.env ?? {
    delete: (key) => delete process2?.env[key],
    get: (key) => process2?.env[key],
    has: (key) => Boolean(process2?.env[key]),
    set: (key, value) => {
      if (process2?.env) {
        process2.env[key] = value;
      }
    },
    toObject: () => process2?.env ?? {}
  };
};

// node_modules/@netlify/otel/dist/main.js
var GET_TRACER = "__netlify__getTracer";
var getTracer = (name, version) => {
  return globalThis[GET_TRACER]?.(name, version);
};
function withActiveSpan(tracer, name, optionsOrFn, contextOrFn, fn) {
  const func = typeof contextOrFn === "function" ? contextOrFn : typeof optionsOrFn === "function" ? optionsOrFn : fn;
  if (!func) {
    throw new Error("function to execute with active span is missing");
  }
  if (!tracer) {
    return func();
  }
  return tracer.withActiveSpan(name, optionsOrFn, contextOrFn, func);
}

// node_modules/@netlify/blobs/dist/chunk-SQCJ2S3G.js
var getEnvironmentContext = () => {
  const context = globalThis.netlifyBlobsContext || getEnvironment().get("NETLIFY_BLOBS_CONTEXT");
  if (typeof context !== "string" || !context) {
    return {};
  }
  const data = base64Decode(context);
  try {
    return JSON.parse(data);
  } catch {
  }
  return {};
};
var MissingBlobsEnvironmentError = class extends Error {
  constructor(requiredProperties) {
    super(
      `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
        ", "
      )}`
    );
    this.name = "MissingBlobsEnvironmentError";
  }
};
var BASE64_PREFIX = "b64;";
var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
var METADATA_MAX_SIZE = 2 * 1024;
var encodeMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }
  const encodedObject = base64Encode(JSON.stringify(metadata));
  const payload = `b64;${encodedObject}`;
  if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
    throw new Error("Metadata object exceeds the maximum size");
  }
  return payload;
};
var decodeMetadata = (header) => {
  if (!header?.startsWith(BASE64_PREFIX)) {
    return {};
  }
  const encodedData = header.slice(BASE64_PREFIX.length);
  const decodedData = base64Decode(encodedData);
  const metadata = JSON.parse(decodedData);
  return metadata;
};
var getMetadataFromResponse = (response) => {
  if (!response.headers) {
    return {};
  }
  const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
  try {
    return decodeMetadata(value);
  } catch {
    throw new Error(
      "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
    );
  }
};
var NF_ERROR = "x-nf-error";
var NF_REQUEST_ID = "x-nf-request-id";
var DEPLOY_STORE_PREFIX = "deploy:";
var SITE_STORE_PREFIX = "site:";
var isDeniedWrite = (res, { method, storeName }) => (res.status === 401 || res.status === 403) && (method === "put" || method === "delete") && storeName !== void 0 && !storeName.startsWith(DEPLOY_STORE_PREFIX);
var blobsErrorMessage = (res, context, responseBody) => {
  let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
  if (res.headers.has(NF_REQUEST_ID)) {
    details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
  }
  if (isDeniedWrite(res, context)) {
    const storeName = context.storeName?.startsWith(SITE_STORE_PREFIX) ? context.storeName.slice(SITE_STORE_PREFIX.length) : context.storeName;
    const summary2 = `Netlify Blobs could not write to store '${storeName}' (${details}).`;
    if (context.edgeAccess) {
      return summary2;
    }
    return `${summary2} Builds and build plugins can only write to deploy-specific stores: use 'getDeployStore' instead of 'getStore', or pass a 'token' with write access to the store. If this code is not running in a build, check that the token and site ID are valid. See https://docs.netlify.com/build/data-and-storage/netlify-blobs/#deploy-specific-stores`;
  }
  let message = `Netlify Blobs has generated an internal error (${details})`;
  if (!res.headers.get(NF_ERROR) && responseBody) {
    message += `: ${responseBody}`;
  }
  return message;
};
var BlobsInternalError = class extends Error {
  constructor(res, context = {}, responseBody) {
    super(blobsErrorMessage(res, context, responseBody));
    this.name = "BlobsInternalError";
    this.status = res.status;
    this.responseBody = responseBody;
  }
};
var createBlobsInternalError = async (res, context = {}) => {
  const responseBody = await res.clone().text().catch(() => void 0);
  return new BlobsInternalError(res, context, responseBody);
};
var discardBody = async (res) => {
  await res.body?.cancel().catch(() => {
  });
};
var collectIterator = async (iterator) => {
  const result = [];
  for await (const item of iterator) {
    result.push(item);
  }
  return result;
};
function withSpan(span, name, fn) {
  if (span) return fn(span);
  return withActiveSpan(getTracer(), name, (span2) => {
    return fn(span2);
  });
}
var BlobsConsistencyError = class extends Error {
  constructor() {
    super(
      `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
    );
    this.name = "BlobsConsistencyError";
  }
};
var REGION_AUTO = "auto";
var regions = {
  "us-east-1": true,
  "us-east-2": true,
  "eu-central-1": true,
  "ap-southeast-1": true,
  "ap-southeast-2": true
};
var isValidRegion = (input) => Object.keys(regions).includes(input);
var InvalidBlobsRegionError = class extends Error {
  constructor(region) {
    super(
      `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
    );
    this.name = "InvalidBlobsRegionError";
  }
};
var DEFAULT_RETRY_DELAY = getEnvironment().get("NODE_ENV") === "test" ? 1 : 5e3;
var MIN_RETRY_DELAY = 1e3;
var MAX_RETRY = 5;
var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
var fetchAndRetry = async (fetch, url, options, attemptsLeft = MAX_RETRY, getRetryUrl) => {
  try {
    const res = await fetch(url, options);
    const isRetryable = res.status === 429 || res.status >= 500 || getRetryUrl !== void 0 && res.status === 403;
    if (attemptsLeft > 0 && isRetryable) {
      await discardBody(res);
      const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
      await sleep(delay);
      const retryUrl = getRetryUrl ? await getRetryUrl() : url;
      return fetchAndRetry(fetch, retryUrl, options, attemptsLeft - 1, getRetryUrl);
    }
    return res;
  } catch (error) {
    if (attemptsLeft === 0) {
      throw error;
    }
    const delay = getDelay();
    await sleep(delay);
    const retryUrl = getRetryUrl ? await getRetryUrl() : url;
    return fetchAndRetry(fetch, retryUrl, options, attemptsLeft - 1, getRetryUrl);
  }
};
var getDelay = (rateLimitReset) => {
  if (!rateLimitReset) {
    return DEFAULT_RETRY_DELAY;
  }
  return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
};
var sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
var Client = class {
  /**
   * Whether requests reach Blobs through the edge rather than the API. Only
   * runtime environments are given an edge URL.
   */
  get edgeAccess() {
    return this.edgeURL !== void 0;
  }
  constructor({ apiURL, consistency, edgeURL, fetch, region, siteID, token, uncachedEdgeURL }) {
    this.apiURL = apiURL;
    this.consistency = consistency ?? "eventual";
    this.edgeURL = edgeURL;
    this.fetch = fetch ?? globalThis.fetch;
    this.region = region;
    this.siteID = siteID;
    this.token = token;
    this.uncachedEdgeURL = uncachedEdgeURL;
    if (!this.fetch) {
      throw new Error(
        "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
      );
    }
  }
  async getFinalRequest({
    consistency: opConsistency,
    key,
    metadata,
    method,
    parameters = {},
    storeName
  }) {
    const encodedMetadata = encodeMetadata(metadata);
    const consistency = opConsistency ?? this.consistency;
    let urlPath = `/${this.siteID}`;
    if (storeName) {
      urlPath += `/${storeName}`;
    }
    if (key) {
      urlPath += `/${key}`;
    }
    if (this.edgeURL) {
      if (consistency === "strong" && !this.uncachedEdgeURL) {
        throw new BlobsConsistencyError();
      }
      const headers = {
        authorization: `Bearer ${this.token}`
      };
      if (encodedMetadata) {
        headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
      }
      if (this.region) {
        urlPath = `/region:${this.region}${urlPath}`;
      }
      const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
      for (const key2 in parameters) {
        url2.searchParams.set(key2, parameters[key2]);
      }
      return {
        headers,
        url: url2.toString()
      };
    }
    const apiHeaders = { authorization: `Bearer ${this.token}` };
    const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
    for (const key2 in parameters) {
      url.searchParams.set(key2, parameters[key2]);
    }
    if (this.region) {
      url.searchParams.set("region", this.region);
    }
    if (storeName === void 0 || key === void 0) {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    if (encodedMetadata) {
      apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
    }
    if (method === "head" || method === "delete") {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    const res = await this.fetch(url.toString(), {
      headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
      method
    });
    if (res.status !== 200) {
      throw await createBlobsInternalError(res, { edgeAccess: this.edgeAccess, method, storeName });
    }
    const { url: signedURL } = await res.json();
    const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
    return {
      headers: userHeaders,
      url: signedURL
    };
  }
  async makeRequest({
    body,
    conditions = {},
    consistency,
    headers: extraHeaders,
    key,
    metadata,
    method,
    parameters,
    storeName
  }) {
    const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
      consistency,
      key,
      metadata,
      method,
      parameters,
      storeName
    });
    const headers = {
      ...baseHeaders,
      ...extraHeaders
    };
    if (method === "put") {
      headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
    }
    if ("onlyIfMatch" in conditions && conditions.onlyIfMatch) {
      headers["if-match"] = conditions.onlyIfMatch;
    } else if ("onlyIfNew" in conditions && conditions.onlyIfNew) {
      headers["if-none-match"] = "*";
    }
    const options = {
      body,
      headers,
      method
    };
    if (body instanceof ReadableStream) {
      options.duplex = "half";
    }
    const usesSignedUrl = !this.edgeURL && key !== void 0 && storeName !== void 0 && method !== "head" && method !== "delete";
    let getRetryUrl;
    if (usesSignedUrl) {
      getRetryUrl = async () => {
        const finalRequest = await this.getFinalRequest({ consistency, key, metadata, method, parameters, storeName });
        return finalRequest.url;
      };
    }
    return fetchAndRetry(this.fetch, url, options, void 0, getRetryUrl);
  }
};
var getClientOptions = (options, contextOverride) => {
  const context = contextOverride ?? getEnvironmentContext();
  const siteID = context.siteID ?? options.siteID;
  const token = context.token ?? options.token;
  if (!siteID || !token) {
    throw new MissingBlobsEnvironmentError(["siteID", "token"]);
  }
  if (options.region !== void 0 && !isValidRegion(options.region)) {
    throw new InvalidBlobsRegionError(options.region);
  }
  const clientOptions = {
    apiURL: context.apiURL ?? options.apiURL,
    consistency: options.consistency,
    edgeURL: context.edgeURL ?? options.edgeURL,
    fetch: options.fetch,
    region: options.region,
    siteID,
    token,
    uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
  };
  return clientOptions;
};

// node_modules/@netlify/blobs/dist/main.js
var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
var STATUS_OK = 200;
var STATUS_PRE_CONDITION_FAILED = 412;
var Store = class _Store {
  constructor(options) {
    this.client = options.client;
    if ("deployID" in options) {
      _Store.validateDeployID(options.deployID);
      let name = DEPLOY_STORE_PREFIX + options.deployID;
      if (options.name) {
        name += `:${options.name}`;
      }
      this.name = name;
    } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
      const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
      _Store.validateStoreName(storeName);
      this.name = storeName;
    } else {
      _Store.validateStoreName(options.name);
      this.name = SITE_STORE_PREFIX + options.name;
    }
  }
  async delete(key) {
    const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
    await discardBody(res);
    if (![200, 204, 404].includes(res.status)) {
      throw new BlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "delete",
        storeName: this.name
      });
    }
  }
  async deleteAll() {
    let totalDeletedBlobs = 0;
    let hasMore = true;
    while (hasMore) {
      const res = await this.client.makeRequest({ method: "delete", storeName: this.name });
      if (res.status !== 200) {
        await discardBody(res);
        throw new BlobsInternalError(res, {
          edgeAccess: this.client.edgeAccess,
          method: "delete",
          storeName: this.name
        });
      }
      const data = await res.json();
      if (typeof data.blobs_deleted !== "number") {
        throw new BlobsInternalError(res);
      }
      totalDeletedBlobs += data.blobs_deleted;
      hasMore = typeof data.has_more === "boolean" && data.has_more;
    }
    return {
      deletedBlobs: totalDeletedBlobs
    };
  }
  async get(key, options) {
    return withSpan(options?.span, "blobs.get", async (span) => {
      const { consistency, type } = options ?? {};
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.type": type,
        "blobs.method": "GET",
        "blobs.consistency": consistency
      });
      const res = await this.client.makeRequest({
        consistency,
        key,
        method: "get",
        storeName: this.name
      });
      span?.setAttributes({
        "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        await discardBody(res);
        return null;
      }
      if (res.status !== 200) {
        await discardBody(res);
        throw new BlobsInternalError(res);
      }
      if (type === void 0 || type === "text") {
        return res.text();
      }
      if (type === "arrayBuffer") {
        return res.arrayBuffer();
      }
      if (type === "blob") {
        return res.blob();
      }
      if (type === "json") {
        return res.json();
      }
      if (type === "stream") {
        return res.body;
      }
      await discardBody(res);
      throw new BlobsInternalError(res);
    });
  }
  async getMetadata(key, options = {}) {
    return withSpan(options?.span, "blobs.getMetadata", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "HEAD",
        "blobs.consistency": options.consistency
      });
      const res = await this.client.makeRequest({
        consistency: options.consistency,
        key,
        method: "head",
        storeName: this.name
      });
      span?.setAttributes({
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        return null;
      }
      if (res.status !== 200 && res.status !== 304) {
        throw new BlobsInternalError(res);
      }
      const etag = res?.headers.get("etag") ?? void 0;
      const metadata = getMetadataFromResponse(res);
      const result = {
        etag,
        metadata
      };
      return result;
    });
  }
  async getWithMetadata(key, options) {
    return withSpan(options?.span, "blobs.getWithMetadata", async (span) => {
      const { consistency, etag: requestETag, type } = options ?? {};
      const headers = requestETag ? { "if-none-match": requestETag } : void 0;
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "GET",
        "blobs.consistency": options?.consistency,
        "blobs.type": type,
        "blobs.request.etag": requestETag
      });
      const res = await this.client.makeRequest({
        consistency,
        headers,
        key,
        method: "get",
        storeName: this.name
      });
      const responseETag = res?.headers.get("etag") ?? void 0;
      span?.setAttributes({
        "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
        "blobs.response.etag": responseETag,
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        await discardBody(res);
        return null;
      }
      if (res.status !== 200 && res.status !== 304) {
        await discardBody(res);
        throw new BlobsInternalError(res);
      }
      const metadata = getMetadataFromResponse(res);
      const result = {
        etag: responseETag,
        metadata
      };
      if (res.status === 304 && requestETag) {
        return { data: null, ...result };
      }
      if (type === void 0 || type === "text") {
        return { data: await res.text(), ...result };
      }
      if (type === "arrayBuffer") {
        return { data: await res.arrayBuffer(), ...result };
      }
      if (type === "blob") {
        return { data: await res.blob(), ...result };
      }
      if (type === "json") {
        return { data: await res.json(), ...result };
      }
      if (type === "stream") {
        return { data: res.body, ...result };
      }
      await discardBody(res);
      throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
    });
  }
  list(options = {}) {
    return withSpan(options.span, "blobs.list", (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.method": "GET",
        "blobs.list.paginate": options.paginate ?? false
      });
      const iterator = this.getListIterator(options);
      if (options.paginate) {
        return iterator;
      }
      return collectIterator(iterator).then(
        (items) => items.reduce(
          (acc, item) => ({
            blobs: [...acc.blobs, ...item.blobs],
            directories: [...acc.directories, ...item.directories]
          }),
          { blobs: [], directories: [] }
        )
      );
    });
  }
  async set(key, data, options = {}) {
    return withSpan(options.span, "blobs.set", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "PUT",
        "blobs.data.size": typeof data == "string" ? data.length : data instanceof Blob ? data.size : data.byteLength,
        "blobs.data.type": typeof data == "string" ? "string" : data instanceof Blob ? "blob" : "arrayBuffer",
        "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
      });
      _Store.validateKey(key);
      const conditions = _Store.getConditions(options);
      const res = await this.client.makeRequest({
        conditions,
        body: data,
        key,
        metadata: options.metadata,
        method: "put",
        storeName: this.name
      });
      const etag = res.headers.get("etag") ?? "";
      span?.setAttributes({
        "blobs.response.etag": etag,
        "blobs.response.status": res.status
      });
      if (conditions) {
        await discardBody(res);
        return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag, modified: true };
      }
      if (res.status === STATUS_OK) {
        await discardBody(res);
        return {
          etag,
          modified: true
        };
      }
      throw await createBlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "put",
        storeName: this.name
      });
    });
  }
  async setJSON(key, data, options = {}) {
    return withSpan(options.span, "blobs.setJSON", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "PUT",
        "blobs.data.type": "json",
        "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
      });
      _Store.validateKey(key);
      const conditions = _Store.getConditions(options);
      const payload = JSON.stringify(data);
      const headers = {
        "content-type": "application/json"
      };
      const res = await this.client.makeRequest({
        conditions,
        body: payload,
        headers,
        key,
        metadata: options.metadata,
        method: "put",
        storeName: this.name
      });
      await discardBody(res);
      const etag = res.headers.get("etag") ?? "";
      span?.setAttributes({
        "blobs.response.etag": etag,
        "blobs.response.status": res.status
      });
      if (conditions) {
        return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag, modified: true };
      }
      if (res.status === STATUS_OK) {
        return {
          etag,
          modified: true
        };
      }
      throw new BlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "put",
        storeName: this.name
      });
    });
  }
  static formatListResultBlob(result) {
    if (!result.key) {
      return null;
    }
    return {
      etag: result.etag,
      key: result.key
    };
  }
  static getConditions(options) {
    if ("onlyIfMatch" in options && "onlyIfNew" in options) {
      throw new Error(
        `The 'onlyIfMatch' and 'onlyIfNew' options are mutually exclusive. Using 'onlyIfMatch' will make the write succeed only if there is an entry for the key with the given content, while 'onlyIfNew' will make the write succeed only if there is no entry for the key.`
      );
    }
    if ("onlyIfMatch" in options && options.onlyIfMatch) {
      if (typeof options.onlyIfMatch !== "string") {
        throw new Error(`The 'onlyIfMatch' property expects a string representing an ETag.`);
      }
      return {
        onlyIfMatch: options.onlyIfMatch
      };
    }
    if ("onlyIfNew" in options && options.onlyIfNew) {
      if (typeof options.onlyIfNew !== "boolean") {
        throw new Error(
          `The 'onlyIfNew' property expects a boolean indicating whether the write should fail if an entry for the key already exists.`
        );
      }
      return {
        onlyIfNew: true
      };
    }
  }
  static validateKey(key) {
    if (key === "") {
      throw new Error("Blob key must not be empty.");
    }
    if (key.startsWith("/") || key.startsWith("%2F")) {
      throw new Error("Blob key must not start with forward slash (/).");
    }
    if (new TextEncoder().encode(key).length > 600) {
      throw new Error(
        "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
      );
    }
  }
  static validateDeployID(deployID) {
    if (!/^\w{1,24}$/.test(deployID)) {
      throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
    }
  }
  static validateStoreName(name) {
    if (name.includes("/") || name.includes("%2F")) {
      throw new Error("Store name must not contain forward slashes (/).");
    }
    if (new TextEncoder().encode(name).length > 64) {
      throw new Error(
        "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
      );
    }
  }
  getListIterator(options) {
    const { client, name: storeName } = this;
    const parameters = {};
    if (options?.prefix) {
      parameters.prefix = options.prefix;
    }
    if (options?.directories) {
      parameters.directories = "true";
    }
    return {
      [Symbol.asyncIterator]() {
        let currentCursor = null;
        let done = false;
        return {
          async next() {
            return withSpan(options?.span, "blobs.list.next", async (span) => {
              span?.setAttributes({
                "blobs.store": storeName,
                "blobs.method": "GET",
                "blobs.list.paginate": options?.paginate ?? false,
                "blobs.list.done": done,
                "blobs.list.cursor": currentCursor ?? void 0
              });
              if (done) {
                return { done: true, value: void 0 };
              }
              const nextParameters = { ...parameters };
              if (currentCursor !== null) {
                nextParameters.cursor = currentCursor;
              }
              const res = await client.makeRequest({
                method: "get",
                parameters: nextParameters,
                storeName
              });
              span?.setAttributes({
                "blobs.response.status": res.status
              });
              let blobs = [];
              let directories = [];
              if (![200, 204, 404].includes(res.status)) {
                await discardBody(res);
                throw new BlobsInternalError(res);
              }
              if (res.status === 404) {
                await discardBody(res);
                done = true;
              } else {
                const page = await res.json();
                if (page.next_cursor) {
                  currentCursor = page.next_cursor;
                } else {
                  done = true;
                }
                blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                directories = page.directories ?? [];
              }
              return {
                done: false,
                value: {
                  blobs,
                  directories
                }
              };
            });
          }
        };
      }
    };
  }
};
var getDeployStoreRegion = (clientOptions, context) => {
  if (clientOptions.region) {
    return clientOptions.region;
  }
  if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
    if (!context.primaryRegion) {
      throw new Error(
        "When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the store options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again."
      );
    }
    return context.primaryRegion;
  }
  return REGION_AUTO;
};
var getStore = (input, options) => {
  if (typeof input === "string") {
    const contextOverride = options?.siteID && options?.token ? { siteID: options?.siteID, token: options?.token } : void 0;
    const clientOptions = getClientOptions(options ?? {}, contextOverride);
    const client = new Client(clientOptions);
    return new Store({ client, name: input });
  }
  if (typeof input?.name === "string") {
    const { name } = input;
    const contextOverride = input?.siteID && input?.token ? { siteID: input?.siteID, token: input?.token } : void 0;
    const clientOptions = getClientOptions(input, contextOverride);
    if (!name) {
      throw new MissingBlobsEnvironmentError(["name"]);
    }
    const client = new Client(clientOptions);
    return new Store({ client, name });
  }
  if (typeof input?.deployID === "string") {
    const context = getEnvironmentContext();
    const clientOptions = getClientOptions(input, context);
    const { deployID } = input;
    if (!deployID) {
      throw new MissingBlobsEnvironmentError(["deployID"]);
    }
    clientOptions.region = getDeployStoreRegion(clientOptions, context);
    const client = new Client(clientOptions);
    return new Store({ client, deployID });
  }
  throw new Error(
    "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
  );
};

// src/qaqc.mjs
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
var config = { path: "/api/*" };
var SERVICE = "lhr212-qaqc";
var VERSION = 1;
var SETS = ["Gen A", "Gen B", "Gen C", "Gen D", "Gen E", "Gen F"];
var MAX_BODY = 5.5 * 1024 * 1024;
var MAX_PHOTO = 5 * 1024 * 1024;
var ITEM_RE = /^\d{1,2}\.\d{2}$/;
var FIELD_RE = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
var UID_RE = /^[A-Za-z0-9_-]{6,64}$/;
var KINDS = ["record", "before", "after"];
var sk = (s) => String(s).replace(/\s+/g, "");
var docKey = (s) => "set/" + sk(s);
var photoKey = (s, u) => "photo/" + sk(s) + "/" + u;
var dailyKey = (s, d) => "daily/" + sk(s) + "/" + d;
var dayOf = (t) => new Date(Number(t) || 0).toISOString().slice(0, 10);
var num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
var sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
var store = () => getStore({ name: SERVICE, consistency: "strong" });
function env(k) {
  try {
    if (globalThis.Netlify && globalThis.Netlify.env) {
      const v = globalThis.Netlify.env.get(k);
      if (v != null) return v;
    }
  } catch (e) {
  }
  return process.env[k];
}
var json = (obj, status2 = 200) => new Response(JSON.stringify(obj), {
  status: status2,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
var normCode = (s) => String(s || "").normalize("NFKC").toLowerCase().replace(/[\s\-_.]+/g, "");
var digest = (s) => createHash("sha256").update("lhr212|" + normCode(s)).digest();
function codeState(req) {
  const want = env("QAQC_CODE");
  if (!want || !normCode(want)) return "unset";
  const got = req.headers.get("x-qaqc-code");
  if (!got) return "missing";
  return timingSafeEqual(digest(got), digest(want)) ? "ok" : "wrong";
}
var isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function canon(v) {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (isObj(v)) return "{" + Object.keys(v).filter((k) => k !== "mt").sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  return JSON.stringify(v === void 0 ? null : v);
}
function hasContent(r) {
  if (!isObj(r)) return false;
  return !!(r.na || String(r.val || "").trim() || String(r.note || "").trim() || Object.values(isObj(r.opts) ? r.opts : {}).some(Boolean) || Array.isArray(r.snags) && r.snags.length);
}
function takeRec(cur, inc) {
  if (!cur) return true;
  const a = num(cur.mt), b = num(inc.mt);
  if (b > a) return true;
  return a === 0 && b === 0 && !hasContent(cur) && hasContent(inc);
}
function takeVal(curV, curT, incV, incT, present) {
  if (!present) return true;
  if (incT > curT) return true;
  return curT === 0 && incT === 0 && !String(curV == null ? "" : curV).trim() && !!String(incV == null ? "" : incV).trim();
}
function cmpId(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  return pa[0] - pb[0] || pa[1] - pb[1] || (a < b ? -1 : a > b ? 1 : 0);
}
function clean(b) {
  const out = { items: {}, meta: {}, sign: {}, photos: {}, snagSeq: 0, layout: Math.max(1, Math.floor(num(b.layout)) || 1) };
  const items = isObj(b.items) ? b.items : {};
  Object.keys(items).slice(0, 2e3).forEach((id) => {
    const r = items[id];
    if (!ITEM_RE.test(id) || !isObj(r)) return;
    if (JSON.stringify(r).length > 2e5) return;
    const c = Object.assign({}, r);
    c.mt = Math.max(0, num(r.mt));
    if (!isObj(c.opts)) c.opts = {};
    if (!Array.isArray(c.snags)) c.snags = [];
    out.items[id] = c;
  });
  [["meta", 4e3], ["sign", 7e5]].forEach(([f, max]) => {
    const src = isObj(b[f]) ? b[f] : {};
    Object.keys(src).slice(0, 200).forEach((k) => {
      const p = src[k];
      if (!FIELD_RE.test(k) || !Array.isArray(p)) return;
      const v = p[0] == null ? "" : String(p[0]);
      if (v.length > max) return;
      out[f][k] = [v, Math.max(0, num(p[1]))];
    });
  });
  const ph = isObj(b.photos) ? b.photos : {};
  Object.keys(ph).slice(0, 5e3).forEach((u) => {
    const e = ph[u];
    if (!UID_RE.test(u) || !isObj(e)) return;
    const c = { mt: Math.max(0, num(e.mt)), del: !!e.del };
    if (!c.del || e.item != null) {
      c.item = String(e.item || "").slice(0, 12);
      c.kind = KINDS.indexOf(e.kind) >= 0 ? e.kind : "record";
      c.snag = Math.max(0, Math.floor(num(e.snag)));
      c.ts = num(e.ts);
      c.caption = String(e.caption || "").slice(0, 500);
      c.layout = Math.max(1, Math.floor(num(e.layout)) || 1);
    }
    out.photos[u] = c;
  });
  out.snagSeq = Math.min(99999, Math.max(0, Math.floor(num(b.snagSeq))));
  return out;
}
function newDoc(set, layout) {
  return {
    service: SERVICE,
    v: VERSION,
    set,
    epoch: randomUUID(),
    rev: 0,
    layout,
    at: 0,
    by: "",
    items: {},
    irv: {},
    meta: {},
    mm: {},
    mrv: {},
    sign: {},
    sm: {},
    srv: {},
    snagSeq: 0,
    photos: {},
    prv: {}
  };
}
function fixDoc(d, set) {
  const n = newDoc(set, num(d && d.layout) || 1);
  if (!isObj(d)) return n;
  ["items", "irv", "meta", "mm", "mrv", "sign", "sm", "srv", "photos", "prv"].forEach((k) => {
    n[k] = isObj(d[k]) ? d[k] : {};
  });
  ["epoch", "by"].forEach((k) => {
    if (d[k]) n[k] = String(d[k]);
  });
  n.rev = num(d.rev);
  n.at = num(d.at);
  n.snagSeq = num(d.snagSeq);
  return n;
}
function summary(doc) {
  let edited = 0, photos = 0, waiting = 0;
  Object.keys(doc.items).forEach((id) => {
    if (num(doc.items[id].mt) > 0) edited++;
  });
  Object.keys(doc.mm).forEach((k) => {
    if (num(doc.mm[k]) > 0) edited++;
  });
  Object.keys(doc.sm).forEach((k) => {
    if (num(doc.sm[k]) > 0) edited++;
  });
  Object.keys(doc.photos).forEach((u) => {
    const e = doc.photos[u];
    if (!e.del) {
      photos++;
      if (!e.up) waiting++;
    }
  });
  return { epoch: doc.epoch, rev: doc.rev, at: doc.at, layout: doc.layout, edited, photos, waiting };
}
function merge(doc, inc, rev, set, now) {
  const r = {
    changed: false,
    echoI: /* @__PURE__ */ new Set(),
    echoM: /* @__PURE__ */ new Set(),
    echoS: /* @__PURE__ */ new Set(),
    echoP: /* @__PURE__ */ new Set(),
    forceI: /* @__PURE__ */ new Set(),
    forceM: /* @__PURE__ */ new Set(),
    forceS: /* @__PURE__ */ new Set(),
    forceP: /* @__PURE__ */ new Set()
  };
  Object.keys(inc.items).forEach((id) => {
    const n = inc.items[id], c = doc.items[id];
    if (takeRec(c, n)) {
      if (!c || canon(c) !== canon(n) || num(c.mt) !== num(n.mt)) {
        doc.items[id] = n;
        doc.irv[id] = rev;
        r.changed = true;
      }
      r.echoI.add(id);
    } else if (canon(c) !== canon(n)) r.forceI.add(id);
  });
  [["meta", "mm", "mrv", "M"], ["sign", "sm", "srv", "S"]].forEach(([f, t, rv, x]) => {
    Object.keys(inc[f]).forEach((k) => {
      const [v, ts] = inc[f][k];
      if (takeVal(doc[f][k], num(doc[t][k]), v, ts, k in doc[f])) {
        if (!(k in doc[f]) || String(doc[f][k]) !== v || num(doc[t][k]) !== ts) {
          doc[f][k] = v;
          if (ts) doc[t][k] = ts;
          doc[rv][k] = rev;
          r.changed = true;
        }
        r["echo" + x].add(k);
      } else if (String(doc[f][k]) !== v) r["force" + x].add(k);
    });
  });
  Object.keys(inc.photos).forEach((u) => {
    const n = inc.photos[u], c = doc.photos[u];
    if (!c || n.mt > num(c.mt)) {
      const e = Object.assign({}, c || {}, n, { up: !!(c && c.up) });
      doc.photos[u] = e;
      doc.prv[u] = rev;
      r.changed = true;
      r.echoP.add(u);
    } else if (n.mt < num(c.mt) || !!n.del !== !!c.del) r.forceP.add(u);
  });
  if (inc.snagSeq > num(doc.snagSeq)) {
    doc.snagSeq = inc.snagSeq;
    r.changed = true;
  }
  if (r.echoI.size) dedupeRefs(doc, r, rev, set, now);
  return r;
}
function dedupeRefs(doc, r, rev, set, now) {
  const L = sk(set).replace(/^Gen/i, "");
  const re = new RegExp("^QASNG-" + L + "-(\\d+)$");
  const owners = {};
  Object.keys(doc.items).sort(cmpId).forEach((id) => {
    const snags = Array.isArray(doc.items[id].snags) ? doc.items[id].snags : [];
    snags.forEach((sg) => {
      if (!isObj(sg)) return;
      const ref = String(sg.ref || "").trim();
      if (ref) (owners[ref] = owners[ref] || []).push({ id, sg });
    });
  });
  let top = num(doc.snagSeq);
  Object.keys(owners).forEach((ref) => {
    const m = re.exec(ref);
    if (m && Number(m[1]) > top) top = Number(m[1]);
  });
  const touched = /* @__PURE__ */ new Set();
  Object.keys(owners).forEach((ref) => {
    const list = owners[ref];
    if (list.length < 2) return;
    let keep = list.findIndex((x) => !r.echoI.has(x.id));
    if (keep < 0) keep = 0;
    list.forEach((x, i) => {
      if (i === keep) return;
      top += 1;
      x.sg.ref = "QASNG-" + L + "-" + String(top).padStart(3, "0");
      touched.add(x.id);
    });
  });
  if (!touched.size) return;
  doc.snagSeq = top;
  touched.forEach((id) => {
    const it = doc.items[id];
    it.mt = Math.max(now, num(it.mt) + 1);
    doc.irv[id] = rev;
    r.echoI.delete(id);
    r.changed = true;
  });
}
function reply(doc, since, r, reset) {
  const out = {
    ok: true,
    epoch: doc.epoch,
    rev: doc.rev,
    now: Date.now(),
    reset: !!reset,
    items: {},
    meta: {},
    sign: {},
    snagSeq: num(doc.snagSeq),
    photos: {},
    need: []
  };
  Object.keys(doc.items).forEach((id) => {
    if (num(doc.irv[id]) > since && !r.echoI.has(id) || r.forceI.has(id)) out.items[id] = doc.items[id];
  });
  [["meta", "mm", "mrv", "M"], ["sign", "sm", "srv", "S"]].forEach(([f, t, rv, x]) => {
    Object.keys(doc[f]).forEach((k) => {
      if (num(doc[rv][k]) > since && !r["echo" + x].has(k) || r["force" + x].has(k)) out[f][k] = [doc[f][k], num(doc[t][k])];
    });
  });
  Object.keys(doc.photos).forEach((u) => {
    const e = doc.photos[u];
    if (num(doc.prv[u]) > since && !r.echoP.has(u) || r.forceP.has(u)) out.photos[u] = e;
    if (!e.del && !e.up) out.need.push(u);
  });
  return out;
}
async function readBody(req, max) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > max) return null;
  const text = await req.text();
  return text.length > max ? null : text;
}
async function write(st, set, got, doc) {
  const opts = { metadata: summary(doc) };
  if (got && !got.etag) throw new Error("the store did not return a version tag - not written");
  if (got) opts.onlyIfMatch = got.etag;
  else opts.onlyIfNew = true;
  const w = await st.setJSON(docKey(set), doc, opts);
  if (w && w.modified && got && got.data && num(got.data.at) && dayOf(got.data.at) !== dayOf(doc.at)) {
    try {
      await st.setJSON(dailyKey(set, dayOf(got.data.at)), got.data, { onlyIfNew: true });
    } catch (e) {
      console.warn("daily copy", e);
    }
  }
  return !!(w && w.modified);
}
async function sync(req) {
  const text = await readBody(req, MAX_BODY);
  if (text == null) return json({ ok: false, code: "too-big" }, 413);
  let b;
  try {
    b = JSON.parse(text);
  } catch (e) {
    return json({ ok: false, code: "bad-request" }, 400);
  }
  if (!isObj(b) || SETS.indexOf(b.set) < 0) return json({ ok: false, code: "bad-set" }, 400);
  const set = b.set, inc = clean(b), st = store();
  const pushing = Object.keys(inc.items).length + Object.keys(inc.meta).length + Object.keys(inc.sign).length + Object.keys(inc.photos).length > 0;
  if (!pushing) {
    const md = await st.getMetadata(docKey(set));
    if (!md) return json({ ok: true, empty: true, epoch: "", rev: 0, now: Date.now(), need: [] });
    const m = md.metadata || {};
    if (num(m.layout) && num(m.layout) !== inc.layout)
      return json({ ok: false, code: inc.layout < num(m.layout) ? "old-form" : "newer-form" }, 409);
    if (b.epoch && b.epoch === m.epoch && num(b.since) === num(m.rev) && !num(m.waiting))
      return json({ ok: true, same: true, epoch: m.epoch, rev: num(m.rev), now: Date.now(), need: [] });
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const got = await st.getWithMetadata(docKey(set), { type: "json" });
    if (!got && !pushing) return json({ ok: true, empty: true, epoch: "", rev: 0, now: Date.now(), need: [] });
    const doc = got ? fixDoc(got.data, set) : newDoc(set, inc.layout);
    if (doc.layout !== inc.layout) return json({ ok: false, code: inc.layout < doc.layout ? "old-form" : "newer-form" }, 409);
    const reset = !b.epoch || b.epoch !== doc.epoch;
    const since = reset ? 0 : Math.max(0, num(b.since));
    const now = Date.now(), rev = doc.rev + 1;
    const r = merge(doc, inc, rev, set, now);
    if (r.changed) {
      doc.rev = rev;
      doc.at = now;
      doc.by = String(b.dev || "").slice(0, 40);
      if (!await write(st, set, got, doc)) {
        await sleep2(40 + Math.random() * 160 * (attempt + 1));
        continue;
      }
    }
    return json(reply(doc, since, r, reset));
  }
  return json({ ok: false, code: "busy" }, 503);
}
async function putPhoto(req, url) {
  const set = url.searchParams.get("set"), uid = url.searchParams.get("uid") || "";
  if (SETS.indexOf(set) < 0 || !UID_RE.test(uid)) return json({ ok: false, code: "bad-request" }, 400);
  const text = await readBody(req, MAX_PHOTO);
  if (text == null) return json({ ok: false, code: "too-big" }, 413);
  if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(text)) return json({ ok: false, code: "not-a-photo" }, 400);
  const st = store();
  const first = await st.getWithMetadata(docKey(set), { type: "json" });
  if (!first || !isObj(first.data.photos) || !first.data.photos[uid]) return json({ ok: false, code: "no-entry" }, 409);
  await st.set(photoKey(set, uid), text, { onlyIfNew: true });
  for (let attempt = 0; attempt < 10; attempt++) {
    const got = attempt ? await st.getWithMetadata(docKey(set), { type: "json" }) : first;
    const doc = fixDoc(got.data, set), e = doc.photos[uid];
    if (!e) return json({ ok: false, code: "no-entry" }, 409);
    if (e.up) return json({ ok: true, rev: doc.rev });
    e.up = true;
    doc.rev += 1;
    doc.prv[uid] = doc.rev;
    doc.at = Date.now();
    if (await write(st, set, got, doc)) return json({ ok: true, rev: doc.rev });
    await sleep2(40 + Math.random() * 160 * (attempt + 1));
  }
  return json({ ok: false, code: "busy" }, 503);
}
async function getPhoto(url) {
  const set = url.searchParams.get("set"), uid = url.searchParams.get("uid") || "";
  if (SETS.indexOf(set) < 0 || !UID_RE.test(uid)) return json({ ok: false, code: "bad-request" }, 400);
  const data = await store().get(photoKey(set, uid), { type: "text" });
  if (data == null) return json({ ok: false, code: "no-photo" }, 404);
  return new Response(data, { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
async function status() {
  const st = store(), sets = {};
  await Promise.all(SETS.map(async (s) => {
    const md = await st.getMetadata(docKey(s));
    const m = md && md.metadata || {};
    sets[s] = { rev: num(m.rev), at: num(m.at), edited: num(m.edited), photos: num(m.photos), waiting: num(m.waiting) };
  }));
  return json({ ok: true, now: Date.now(), sets });
}
var qaqc_default = async (req) => {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  try {
    const cs = codeState(req);
    if (route === "ping")
      return json({
        ok: true,
        service: SERVICE,
        v: VERSION,
        configured: cs !== "unset",
        auth: cs === "ok" ? true : cs === "wrong" ? false : null,
        now: Date.now()
      });
    if (cs === "unset") return json({ ok: false, code: "not-configured" }, 503);
    if (cs !== "ok") {
      await sleep2(300);
      return json({ ok: false, code: "bad-code" }, 401);
    }
    if (route === "sync" && req.method === "POST") return await sync(req);
    if (route === "photo" && req.method === "PUT") return await putPhoto(req, url);
    if (route === "photo-get" && (req.method === "POST" || req.method === "GET")) return await getPhoto(url);
    if (route === "status" && (req.method === "POST" || req.method === "GET")) return await status();
    return json({ ok: false, code: "not-found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ ok: false, code: "server", msg: String(err && err.message || err).slice(0, 300) }, 500);
  }
};
export {
  config,
  qaqc_default as default
};
