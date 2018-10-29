import { errorHandler } from './errorHandler';

/**
 * The main load function
 */
export function load(url: string, headers: { [key: string]: string }): Promise<Response> {
	return crossBrowserFetch(url, { method: 'GET', headers });
}

/**
 * The recurisve loader allows to retry requests
 */
export function recursiveLoader(
	loadFn: typeof load,
	url: string,
	headers: { [key: string]: string }
): Promise<Response> {
	const errorHandlingAttemps: Array<string> = [];
	/**
	 * Recursive helper function to retry the load
	 * until either the response is okay or the errhandler can't handle the error
	 */
	function loadWithErrorHandling(): Promise<Response> {
		return loadFn(url, headers).then((response: Response) => {
			return response.ok
				? response
				: errorHandler(response, errorHandlingAttemps).then(
						(resolverName) => {
							// Store the resolver name
							errorHandlingAttemps.push(resolverName);
							// Retry loading
							return loadWithErrorHandling();
						},
						() => response
				  );
		});
	}
	return loadWithErrorHandling();
}

/**
 * Small helper to lazy load the fech library if missing (IE11)
 */
function crossBrowserFetch(url: string, init?: RequestInit): Promise<Response> {
	if (typeof fetch === 'undefined') {
		// Lazy load ponyfill if necessary
		return import(/* webpackChunkName: "request-registry-fetch-ponyfill" */ 'fetch-ponyfill' as any).then(
			(fetchPonyfill) => fetchPonyfill.default().fetch(url, init) as Response
		);
	}
	return fetch(url, init);
}
