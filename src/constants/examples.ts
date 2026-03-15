export const EXAMPLES: { label: string; json: string }[] = [
  {
    label: 'API Response',
    json: JSON.stringify(
      {
        status: 'success',
        data: {
          users: [
            {
              id: 1,
              name: 'Alice Johnson',
              email: 'alice@example.com',
              role: 'admin',
              active: true,
              joinedAt: '2023-01-15T09:00:00Z',
            },
            {
              id: 2,
              name: 'Bob Smith',
              email: 'bob@example.com',
              role: 'user',
              active: false,
              joinedAt: '2023-03-22T14:30:00Z',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
        },
        meta: {
          requestId: 'req_abc123',
          durationMs: 42,
        },
      },
      null,
      2
    ),
  },
  {
    label: 'Package.json',
    json: JSON.stringify(
      {
        name: 'my-project',
        version: '1.0.0',
        description: 'A sample project',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          lint: 'eslint .',
          test: 'vitest',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          vite: '^5.0.0',
        },
      },
      null,
      2
    ),
  },
  {
    label: 'GeoJSON',
    json: JSON.stringify(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-122.4194, 37.7749],
            },
            properties: {
              name: 'San Francisco',
              population: 873965,
              country: 'US',
            },
          },
        ],
      },
      null,
      2
    ),
  },
  {
    label: 'Invalid JSON',
    json: `{
  "name": "broken example",
  "values": [1, 2, 3,],
  "flag": true,
  "note": "trailing comma above is invalid"
}`,
  },
]
