import { Client } from 'minio';

export const minio = new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER ?? 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin',
});

export const ensureBucket = async (bucket: string): Promise<void> => {
    const exists = await minio.bucketExists(bucket);
    if (!exists) {
        await minio.makeBucket(bucket);
    }
};
