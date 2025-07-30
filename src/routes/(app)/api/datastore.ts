export let otpStore: { [key: string]: string } = {};

// datastore.ts
class DataStore {
  private static instance: DataStore;
  private store: { [key: string]: any } = {};
  private timers: { [key: string]: NodeJS.Timeout } = {};

  private constructor() {}

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  public set(key: string, value: any, ttl: number) {
    this.store[key] = value;

    // 既存のタイマーがある場合はクリア
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
    }

    // ttl（ミリ秒）後にデータを削除
    this.timers[key] = setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  public get(key: string): any {
    return this.store[key];
  }

  public delete(key: string): void {
    delete this.store[key];
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }
}

export default DataStore;
