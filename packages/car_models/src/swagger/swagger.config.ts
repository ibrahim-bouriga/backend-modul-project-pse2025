import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Models API',
      version: '1.0.0',
      description: 'Car Models Service - Manage and retrieve car model information',
      contact: {
        name: 'API Support',
        email: 'support@autodrive.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4001',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Car Models',
        description: 'Car model catalog and information',
      },
    ],
    components: {
      schemas: {
        CarModel: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Car model ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Car model name',
              example: 'Aventador SVJ',
            },
            year: {
              type: 'integer',
              description: 'Model year',
              example: 2024,
            },
            description: {
              type: 'string',
              description: 'Car model description',
              example: 'The ultimate expression of performance and design',
            },
            imageKey: {
              type: 'string',
              description: 'Image storage key',
              example: 'aventador-svj.webp',
            },
            imageUrl: {
              type: 'string',
              description: 'Full image URL',
              example: 'http://localhost:9000/car-models/aventador-svj.webp',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-12-31T23:59:59Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-12-31T23:59:59Z',
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
              example: 'car_models',
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
