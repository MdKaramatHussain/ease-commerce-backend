import { CacheService } from "../../src/cache/cache.service";

describe("Cache Service", () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService(1000000); // Large cleanup interval for tests
  });

  afterEach(() => {
    cache.destroy();
  });

  it("should set and get values", () => {
    cache.set("key1", "value1", 100);
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should return null for expired keys", async () => {
    cache.set("key1", "value1", 0.1); // 100ms TTL
    
    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 150));
    
    expect(cache.get("key1")).toBeNull();
  });

  it("should check if key exists", () => {
    cache.set("key1", "value1", 100);
    expect(cache.has("key1")).toBe(true);
    expect(cache.has("nonexistent")).toBe(false);
  });

  it("should delete keys", () => {
    cache.set("key1", "value1", 100);
    expect(cache.has("key1")).toBe(true);
    
    cache.delete("key1");
    expect(cache.has("key1")).toBe(false);
  });

  it("should clear all entries", () => {
    cache.set("key1", "value1", 100);
    cache.set("key2", "value2", 100);
    
    cache.clear();
    
    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBeNull();
  });

  it("should store complex objects", () => {
    const obj = { name: "test", data: [1, 2, 3] };
    cache.set("obj", obj, 100);
    
    expect(cache.get("obj")).toEqual(obj);
  });
});
