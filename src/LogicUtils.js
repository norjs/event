/**
 *
 */
class LogicUtils {

	/**
	 *
	 * @param f {Function}
	 * @param handleError {Function}
	 * @returns {*}
	 */
	static tryCatch (f, handleError) {
		try {
			return f();
		} catch (err) {
			return handleError(err);
		}
	}

}

// Exports
module.exports = LogicUtils;
