import { Client } from 'minio';

export const minio = new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER ?? 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin',
});

export const ensurePublicBucket = async (bucket: string): Promise<void> => {
    const exists = await minio.bucketExists(bucket);
    if (!exists) {
        await minio.makeBucket(bucket);
    }
    // Set bucket policy to public read so image URLs work directly in the browser
    await minio.setBucketPolicy(bucket, JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
        }],
    }));
};
