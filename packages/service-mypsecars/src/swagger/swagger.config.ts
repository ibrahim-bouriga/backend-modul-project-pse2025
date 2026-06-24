import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyPSECars Telemetry API',
      version: '1.0.0',
      description: 'MyPSECars Telemetry Service - Real-time vehicle telemetry data management',
      contact: {
        name: 'API Support',
        email: 'support@autodrive.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4004',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and service information endpoints',
      },
      {
        name: 'Telemetry',
        description: 'Vehicle telemetry data operations',
      },
    ],
    components: {
      schemas: {
        TelemetryState: {
          type: 'object',
          properties: {
            fuel: {
              type: 'number',
              nullable: true,
              description: 'Current fuel level (0-100)',
              example: 75.5,
            },
            position: {
              type: 'object',
              nullable: true,
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude coordinate',
                  example: 48.8566,
                },
                lng: {
                  type: 'number',
                  description: 'Longitude coordinate',
                  example: 2.3522,
                },
              },
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last update timestamp',
              example: '2024-12-31T23:59:59Z',
            },
          },
        },
        TelemetryIngestRequest: {
          type: 'object',
          properties: {
            fuel: {
              type: 'number',
              description: 'Fuel level (0-100)',
              example: 75.5,
            },
            position: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude coordinate',
                  example: 48.8566,
                },
                lng: {
                  type: 'number',
                  description: 'Longitude coordinate',
                  example: 2.3522,
                },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            service: {
              type: 'string',
              example: 'service-mypsecars',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59Z',
            },
          },
        },
        ServiceInfo: {
          type: 'object',
          properties: {
            service: {
              type: 'string',
              example: 'service-mypsecars',
            },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  method: {
                    type: 'string',
                    example: 'GET',
                  },
                  path: {
                    type: 'string',
                    example: '/api/health',
                  },
                },
              },
            },
          },
        },
        IngestResponse: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: true,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Internal server error',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
              example: 'An unexpected error occurred',
            },
          },
        },
      },
    },
  },
  apis: ['./src/swagger/*.docs.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

