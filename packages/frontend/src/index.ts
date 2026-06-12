// Frontend TypeScript entry point
// This file can be used for more complex TypeScript logic

export function initApp(): void {
    console.log('TypeScript frontend initialized');
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
    initApp();
}
