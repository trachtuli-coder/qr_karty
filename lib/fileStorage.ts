// File storage utility - ukládá soubory do paměti a drží jen cesty

export interface StoredFile {
  id: string;
  file: File;
  url: string; // Blob URL pro preview
  timestamp: number;
}

class FileStorageManager {
  private files: Map<string, StoredFile> = new Map();
  private maxAge = 24 * 60 * 60 * 1000; // 24 hodiny

  // Uloží soubor a vrátí URL
  storeFile(file: File, id: string): string {
    // Vyčistíme staré soubory
    this.cleanup();
    
    // Vytvoříme Blob URL
    const url = URL.createObjectURL(file);
    
    // Uložíme soubor do paměti
    this.files.set(id, {
      id,
      file,
      url,
      timestamp: Date.now()
    });
    
    return url;
  }

  // Získá soubor podle ID
  getFile(id: string): StoredFile | null {
    return this.files.get(id) || null;
  }

  // Získá URL podle ID
  getUrl(id: string): string | null {
    const stored = this.files.get(id);
    return stored ? stored.url : null;
  }

  // Smaže soubor podle ID
  deleteFile(id: string): void {
    const stored = this.files.get(id);
    if (stored) {
      URL.revokeObjectURL(stored.url);
      this.files.delete(id);
    }
  }

  // Vyčistí staré soubory
  private cleanup(): void {
    const now = Date.now();
    for (const [id, stored] of this.files) {
      if (now - stored.timestamp > this.maxAge) {
        URL.revokeObjectURL(stored.url);
        this.files.delete(id);
      }
    }
  }

  // Vyčistí všechny soubory
  clear(): void {
    for (const [id, stored] of this.files) {
      URL.revokeObjectURL(stored.url);
    }
    this.files.clear();
  }

  // Získá všechny soubory
  getAllFiles(): Map<string, StoredFile> {
    this.cleanup();
    return new Map(this.files);
  }

  // Export pro tisk - převede soubory na Base64 jen dočasně
  async exportForPrint(): Promise<{ [key: string]: string }> {
    const result: { [key: string]: string } = {};
    
    for (const [id, stored] of this.files) {
      if (stored.file.type.startsWith('image/')) {
        result[id] = await this.fileToBase64(stored.file);
      }
    }
    
    return result;
  }

  // Převod File na Base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Singleton instance
export const fileStorage = new FileStorageManager();
