/**
 * @swagger
 * /:
 *   get:
 *     summary: Service information
 *     description: Get information about the service and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceInfo'
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the telemetry service is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

/**
 * @swagger
 * /api/telemetry:
 *   get:
 *     summary: Get current telemetry data
 *     description: Retrieve the current vehicle telemetry state including fuel level and position
 *     tags: [Telemetry]
 *     responses:
 *       200:
 *         description: Telemetry data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TelemetryState'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/telemetry/ingest:
 *   post:
 *     summary: Ingest telemetry data
 *     description: Submit new telemetry data (fuel level and/or position) to the service
 *     tags: [Telemetry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TelemetryIngestRequest'
 *           examples:
 *             fuelOnly:
 *               summary: Update fuel level only
 *               value:
 *                 fuel: 75.5
 *             positionOnly:
 *               summary: Update position only
 *               value:
 *                 position:
 *                   lat: 48.8566
 *                   lng: 2.3522
 *             both:
 *               summary: Update both fuel and position
 *               value:
 *                 fuel: 75.5
 *                 position:
 *                   lat: 48.8566
 *                   lng: 2.3522
 *     responses:
 *       200:
 *         description: Telemetry data ingested successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IngestResponse'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

