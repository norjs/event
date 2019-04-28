const LogicUtils = require("@norjs/utils/LogicUtils.js");
const TypeUtils = require("@norjs/utils/TypeUtils.js");
const QUERY_STRING = require('querystring');

let ENABLE_DEBUG = false;

/**
 *
 */
class SocketHttpClient {

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

    /**
     *
     * @param socket {string} The socket file for nor-kvm-service
     * @param http {module:http} Node.js HTTP module
     */
    constructor ({socket, http} = {}) {
        TypeUtils.assert(socket, "string");
        TypeUtils.assert(http, "object");
        this._socket = socket;
        this._http = http;
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

        const path = params ? `${target}?${QUERY_STRING.stringify(params)}` : target;

        const socketPath = this._socket;

        if (this.isDebugEnabled()) console.log(`Going to request "${method} ${path}" from "${socketPath}"...`);

        return new Promise((resolve, reject) => {
            LogicUtils.tryCatch( () => {
                if (this.isDebugEnabled()) console.log(`Calling request "${method} ${path}" from "${socketPath}"...`);
                const req = this._http.request({
                    method,
                    path,
                    socketPath
                }, (res) => {
                    LogicUtils.tryCatch( () => {
                        if (this.isDebugEnabled()) console.log('Got response. Parsing.');

                        const statusCode = res.statusCode;
                        const body = [];
                        res.on('data', (chunk) => {
                            LogicUtils.tryCatch( () => body.push(chunk), reject);
                        });
                        res.on('end', () => {
                            LogicUtils.tryCatch( () => {

                                const isSuccess = statusCode >= 200 && statusCode < 400;

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

}

TypeUtils.defineType("SocketHttpClient", TypeUtils.classToTestType(SocketHttpClient));

/**
 *
 * @type {typeof SocketHttpClient}
 */
module.exports = SocketHttpClient;
