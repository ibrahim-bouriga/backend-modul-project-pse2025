import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// Load OpenAPI specs from YAML files
const carsApiPath = join(process.cwd(), 'src/openapi-cars.yaml');
const merchandiseApiPath = join(process.cwd(), 'src/openapi-merchandise.yaml');

const carsApiContent = readFileSync(carsApiPath, 'utf8');
const merchandiseApiContent = readFileSync(merchandiseApiPath, 'utf8');

const carsSpec = YAML.parse(carsApiContent);
const merchandiseSpec = YAML.parse(merchandiseApiContent);

export function setupSwagger(app: Express): void {
  // Serve Cars API documentation at /api-docs/cars
  app.use('/api-docs/cars', swaggerUi.serveFiles(carsSpec), swaggerUi.setup(carsSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PSE 2025 Cars API',
  }));
  
  // Serve Merchandise API documentation at /api-docs/merchandise
  app.use('/api-docs/merchandise', swaggerUi.serveFiles(merchandiseSpec), swaggerUi.setup(merchandiseSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PSE 2025 Merchandise API',
  }));
  
  // Create an index page for API documentation
  app.get('/api-docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PSE 2025 API Documentation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
          }
          .api-section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .api-section h2 {
            color: #007bff;
            margin-top: 0;
          }
          .api-section p {
            color: #666;
            line-height: 1.6;
          }
          a {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            transition: background 0.3s;
          }
          a:hover {
            background: #0056b3;
          }
        </style>
      </head>
      <body>
        <h1>PSE 2025 Backend API Documentation</h1>
        
        <div class="api-section">
          <h2>Cars API</h2>
          <p>Browse car models, view details, and manage car configurations.</p>
          <p><strong>Endpoints:</strong> /api/cars, /api/cars/:id, /api/cars/:id/configs</p>
          <a href="/api-docs/cars">View Cars API Documentation →</a>
        </div>

        <div class="api-section">
          <h2>Merchandise Shop API</h2>
          <p>Browse products, manage shopping cart, and process orders.</p>
          <p><strong>Endpoints:</strong> /api/products, /api/cart, /api/orders</p>
          <a href="/api-docs/merchandise">View Merchandise API Documentation →</a>
        </div>
      </body>
      </html>
    `);
  });
  
  // Serve OpenAPI specs as JSON
  app.get('/api-docs/cars.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(carsSpec);
  });
  
  app.get('/api-docs/merchandise.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(merchandiseSpec);
  });
  
  console.log('Swagger UI available at:');
  console.log('  - http://localhost:4000/api-docs (index)');
  console.log('  - http://localhost:4000/api-docs/cars (Cars API)');
  console.log('  - http://localhost:4000/api-docs/merchandise (Merchandise API)');
}

