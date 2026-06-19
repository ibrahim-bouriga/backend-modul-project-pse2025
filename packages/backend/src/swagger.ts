import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// Load OpenAPI spec from YAML file
const openapiPath = join(process.cwd(), 'src/openapi.yaml');
const openapiContent = readFileSync(openapiPath, 'utf8');
const swaggerSpec = YAML.parse(openapiContent);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PSE 2025 API Docs',
  }));
  
  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Swagger UI available at http://localhost:4000/api-docs');
}
