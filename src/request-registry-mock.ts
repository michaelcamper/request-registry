//
// This is a dev util to allow mocking during development
//
import { EndpointGetFunction } from "./index";
type EndpointKeys<
  TEndpointGetFunction
> = TEndpointGetFunction extends EndpointGetFunction<infer TKeys, infer TResult>
  ? TKeys
  : never;
type EndpointResult<
  TEndpointGetFunction
> = TEndpointGetFunction extends EndpointGetFunction<infer TKeys, infer TResult>
  ? TResult
  : never;

/**
 * Helper to store all original loader functions to revert back to the original
 */
const originalLoaders = new WeakMap<
  EndpointGetFunction<any, any>,
  (keys: any, url: string, headers: { [key: string]: string }) => Promise<any>
>();
/**
 * Set of all currently active mocks
 */
const activeMocks = new Set<EndpointGetFunction<any, any>>();

/**
 * Create a mock controller which allows to easily activate or deactivate this mock version
 * Usage:
 *
 * ```
 *    const userJoeMock = createMockEndpoint(getUserName, async () => ({name: 'Joe'}));
 *    // Activate mock:
 *    userJoeMock.activate();
 *    // Deactivate mock:
 *    userJoeMock.deactivate();
 * ```
 *
 */
export function createEndpointMock<
  TEndpoint extends EndpointGetFunction<any, any>,
  TKeys extends EndpointKeys<TEndpoint>,
  TResult extends EndpointResult<TEndpoint>,
  TMock extends (keys: TKeys, url: string) => Promise<TResult>
>(endpoint: TEndpoint, mockResponse: TMock) {
  return {
    activate: () =>
      mockEndpoint<TKeys, TResult, TEndpoint, TMock>(endpoint, mockResponse),
    clear: () => unmockEndpoint(endpoint)
  };
}

/**
 * Activate only the given mocks
 * Usage:
 *
 * ```
 *    const userJoeMock = createMockEndpoint(getUserName, async () => ({name: 'Joe'}));
 *    const userAgeMock = createMockEndpoint(getAgeName, async () => ({age: 99}));
 *    activateMocks([userJoeMock, userAgeMock])
 * ```
 *
 */
export function activateMocks(endpointMocks: Array<{ activate: () => void }>) {
  endpointMocks.forEach(endpointMocks => endpointMocks.activate());
}

/**
 * Activate a mock for a given endpoint
 * This mock will be executed whenever the endpoint is loaded
 */
function mockEndpoint<
  TKeys extends {},
  TResult extends unknown,
  TEndpoint extends EndpointGetFunction<TKeys, TResult>,
  TMock extends (keys: TKeys, url: string) => Promise<TResult>
>(endpoint: TEndpoint, mockResponse: TMock) {
  if (!originalLoaders.has(endpoint)) {
    originalLoaders.set(endpoint, endpoint.loader);
  }
  endpoint.loader = mockResponse;
  activeMocks.add(endpoint);
  return unmockEndpoint.bind(null, endpoint);
}

/**
 * Reverts back to the original endpoint behaviour
 */
function unmockEndpoint(endpoint: EndpointGetFunction<any, any>) {
  const loader = originalLoaders.get(endpoint);
  if (!loader) {
    return;
  }
  endpoint.loader = loader;
  activeMocks.delete(endpoint);
  originalLoaders.delete(endpoint);
}

/**
 * unmock all active endpoints
 */
export function unmockAllEndpoints() {
  activeMocks.forEach(mockedEndpoint => unmockEndpoint(mockedEndpoint));
}
