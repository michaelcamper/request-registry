import fetchMock from 'fetch-mock';
import { createGetEndpoint } from './index';

afterEach(() => {
	fetchMock.restore();
});

test('should be able to use an endpoint with dynamic keys', async () => {
	fetchMock.get('http://example.com/user/4', () => ({ firstName: 'Joe' }));
	const userEndpoint = createGetEndpoint<{ id: string }, { firstName: string }>({
		url: (keys) => `http://example.com/user/${keys.id}`,
	});
	const user = await userEndpoint({ id: '4' });
	expect(user).toEqual({ firstName: 'Joe' });
});

test('should be able to use the cache of an endpoint', async () => {
	let requestCount = 0;
	fetchMock.get('http://example.com/user/4', () => {
		requestCount++;
		return {
			firstName: 'Joe',
		};
	});
	const userEndpoint = createGetEndpoint<{ id: string }, { firstName: string }>({
		url: (keys) => `http://example.com/user/${keys.id}`,
	});
	await userEndpoint({ id: '4' });
	await userEndpoint({ id: '4' });
	await userEndpoint({ id: '4' });
	await userEndpoint({ id: '4' });
	expect(requestCount).toEqual(1);
});

test('should fire the success function once a request succeeds', async () => {
	let successCount = 0;
	fetchMock.get('http://example.com/user/4', () => ({ firstName: 'Joe' }));

	const userEndpoint = createGetEndpoint<{ id: string }, { firstName: string }>({
		url: (keys) => `http://example.com/user/${keys.id}`,
		afterSuccess: () => successCount++,
	});
	await userEndpoint({ id: '4' });
	await userEndpoint({ id: '4' });
	await userEndpoint({ id: '4' });
	await userEndpoint({ id: '4' });
	expect(successCount).toEqual(1);
});

test('should fire the error function once a request fails', async () => {
	let errorCount = 0;
	fetchMock.get('http://example.com/user/4', 404);
	const userEndpoint = createGetEndpoint<{ id: string }, { firstName: string }>({
		url: (keys) => `http://example.com/user/${keys.id}`,
		afterError: () => errorCount++,
	});
	await userEndpoint({ id: '4' }).catch((error) => error);
	expect(errorCount).toEqual(1);
});

test('should fire the error function once a request fails', async () => {
	fetchMock.get('http://example.com/user/4', 404);
	const userEndpoint = createGetEndpoint<{ id: string }, { firstName: string }>({
		url: (keys) => `http://example.com/user/${keys.id}`,
	});
	const error = await userEndpoint({ id: '4' }).catch((error) => error);
	expect(error.message).toEqual("Unexpected status 404 - \"Not Found\".");
});


test('should allow to use a custom loader', async () => {
	const userEndpoint = createGetEndpoint<{ id: string }, { firstName: string }>({
		url: (keys) => `http://example.com/user/${keys.id}`,
		loader: async () => ({ firstName: 'Sue'})
	});
	const user = await userEndpoint({ id: '4' });
	expect(user).toEqual({ firstName: 'Sue' });
});
