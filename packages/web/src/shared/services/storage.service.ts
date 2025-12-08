export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}

export class LocalStorageAdapter implements StorageAdapter {
    getItem(key: string): string | null {
        return localStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }
}

export class StorageService {
    private static instance: StorageService;
    private adapter: StorageAdapter;

    private constructor(adapter: StorageAdapter) {
        this.adapter = adapter;
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService(new LocalStorageAdapter());
        }
        return StorageService.instance;
    }

    // Allow injecting a different adapter (e.g., for testing)
    public static setAdapter(adapter: StorageAdapter) {
        if (StorageService.instance) {
            StorageService.instance.adapter = adapter;
        } else {
            StorageService.instance = new StorageService(adapter);
        }
    }

    getItem(key: string): string | null {
        return this.adapter.getItem(key);
    }

    setItem(key: string, value: string): void {
        this.adapter.setItem(key, value);
    }

    removeItem(key: string): void {
        this.adapter.removeItem(key);
    }

    clear(): void {
        this.adapter.clear();
    }
}

export const storage = StorageService.getInstance();
