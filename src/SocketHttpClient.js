// Interfaces
require('./interfaces/HttpClientModule.js');
require('./interfaces/QueryStringModule.js');

/**
 *
 * @member {typeof LogicUtils}
 */
const LogicUtils = require("@norjs/utils/Logic");

/**
 *
 * @member {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {boolean}
 */
let ENABLE_DEBUG = false;

/**
 *
 */
class SocketHttpClient {

    /**
     *
     * @param socket {string} The socket file for nor-kvm-service
     * @param httpModule {HttpClientModule} Node.js 'http' module
     * @param queryStringModule {QueryStringModule} Node.js 'querystring' module
     */
    constructor ({
        socket,
        httpModule,
        queryStringModule
    } = {}) {

        TypeUtils.assert(socket, "string");
        TypeUtils.assert(httpModule, "HttpClientModule");
        TypeUtils.assert(queryStringModule, "QueryStringModule");

        /**
         *
         * @member {string}
         * @private
         */
        this._socket = socket;

        /**
         * @member {HttpClientModule}
         */
        this._http = httpModule;

        /**
         * @member {QueryStringModule}
         */
        this._queryString = queryStringModule;

    }

    /**
     *
     * @returns {typeof SocketHttpClient}
     */
    getClass () {
        return this.constructor;
    }

    /**
     *
     * @returns {boolean}
     */
    isDebugEnabled () {
        return this.getClass().isDebugEnabled();
    }

    /**
     *
     * @param target {string} The target path, eg. `"/libvirt/hooks/qemu"`.
     * @param method {string} The HTTP method as a string.
     * @param params {{}} Optional query parameters.
     * @param inputString {string}
     * @return {Promise}
     * @protected
     */
    _requestBuffer ({
                        target,
                        method = 'GET',
                        params = undefined,
                        inputString = undefined
                    }) {

        TypeUtils.assert(target, "string");
        TypeUtils.assert(method, "string");
        if (params !== undefined) TypeUtils.assert(params, "{}");
        if (inputString !== undefined) TypeUtils.assert(inputString, "string");

        const path = params ? `${target}?${this._queryString.stringify(params)}` : target;

        const socketPath = this._socket;

        if (this.isDebugEnabled()) console.log(`Going to request "${method} ${path}" from "${socketPath}"...`);

        return new Promise((resolve, reject) => {
            LogicUtils.tryCatch( () => {
                if (this.isDebugEnabled()) console.log(`Calling request "${method} ${path}" from "${socketPath}"...`);

                /**
                 *
                 * @type {HttpClientRequestObject}
                 */
                const req = this._http.request({
                    method,
                    path,
                    socketPath
                }, (res) => {
                    LogicUtils.tryCatch( () => {
                        if (this.isDebugEnabled()) console.log('Got response. Parsing.');

                        const statusCode = res.statusCode;
                        const isSuccess = statusCode >= 200 && statusCode < 400;
                        const body = [];
                        res.on('data', (chunk) => {
                            LogicUtils.tryCatch( () => body.push(chunk), reject);
                        });
                        res.on('end', () => {
                            LogicUtils.tryCatch( () => {

                                if (this.isDebugEnabled()) console.log(`Response ended as ${statusCode} with ${body.length} chunks.`);

                                const buffer = Buffer.concat(body);

                                if (this.isDebugEnabled()) console.log(`Response has ${buffer.length} bytes.`);

                                if (isSuccess) {
                                    resolve(buffer);
                                } else {
                                    reject(buffer);
                                }
                            }, reject);
                        });

                    }, reject);
                });

                req.on('error', reject);

                if (inputString !== undefined) {
                    req.write(inputString, 'utf8');
                }

                req.end();

            }, reject);
        });
    }

    /**
     *
     * @param target {string} The target path, eg. `"/libvirt/hooks/qemu"`.
     * @param method {string} The HTTP method as a string.
     * @param params {{}} Optional query parameters.
     * @param input {*}
     * @return {Promise<any> | !Promise<*>}
     * @protected
     */
    _requestJson ({
                      target,
                      method = 'GET',
                      params = undefined,
                      input = undefined
                  }) {
        const inputString = input ? JSON.stringify(input) : undefined;
        const parseToJson = buffer => this.getClass().parseToJson(buffer);
        return this._requestBuffer({target, method, params, inputString}).then(
            parseToJson,
            buffer => Promise.reject(parseToJson(buffer))
        );
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param target {string}
     * @param params {{}}
     * @returns {Promise}
     * @protected
     */
    _getBuffer (target, params = undefined) {
        return this._requestBuffer({target, params, method: 'GET'});
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param target {string}
     * @param params {{}}
     * @returns {Promise}
     * @protected
     */
    _postBuffer (target, params = undefined) {
        return this._requestBuffer({target, params, method: 'POST'});
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param target {string}
     * @param params {{}}
     * @returns {Promise}
     */
    getJson (target, params = undefined) {
        TypeUtils.assert(target, "string");
        if (params !== undefined) TypeUtils.assert(params, "{}");
        return this._requestJson({target, params, method: 'GET'});
    }

    /**
     *
     * @param target {string}
     * @param params {{}}
     * @param input {*}
     * @returns {Promise<any> | !Promise<*>}
     */
    postJson (target, params = undefined, {input = undefined} = {}) {
        TypeUtils.assert(target, "string");
        if (params !== undefined) TypeUtils.assert(params, "{}");
        return this._requestJson({target, params, method: 'POST', input});
    }

    /**
     *
     * @param buffer {Buffer|*}
     * @returns {string|*}
     */
    static parseToJson (buffer) {
        if (buffer instanceof Buffer) {
            // return LogicUtils.tryCatch( () => {
            if (this.isDebugEnabled()) console.debug(`Going to parse ${buffer.length} bytes.`);
            const stringData = buffer.toString('utf8');
            if (this.isDebugEnabled()) console.debug(`Parsed: "${stringData}"`);
            return JSON.parse(stringData);
            // }, err => Promise.reject(err));
        }
        return buffer;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param value {boolean}
     * @public
     */
    static setDebugEnabled (value) {
        ENABLE_DEBUG = !!value;
    }

    /**
     *
     * @returns {boolean}
     * @public
     */
    static isDebugEnabled () {
        return ENABLE_DEBUG;
    }

}

TypeUtils.defineType("SocketHttpClient", TypeUtils.classToTestType(SocketHttpClient));

/**
 *
 * @type {typeof SocketHttpClient}
 */
module.exports = SocketHttpClient;
