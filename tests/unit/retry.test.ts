import { retryWithBackoff, generateBatchId, generateAwbNumber } from "../../src/utils/retry";

describe("Retry Utility", () => {
  it("should retry failed operations with exponential backoff", async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Temporary failure");
      }
      return "Success";
    };

    const result = await retryWithBackoff(operation, 3, 10);
    expect(result).toBe("Success");
    expect(attempts).toBe(3);
  });

  it("should fail after max retries", async () => {
    const operation = async () => {
      throw new Error("Permanent failure");
    };

    try {
      await retryWithBackoff(operation, 2, 10);
      fail("Should have thrown error");
    } catch (error) {
      expect((error as Error).message).toContain("Failed after");
    }
  });
});

describe("ID Generation", () => {
  it("should generate unique batch IDs", () => {
    const id1 = generateBatchId();
    const id2 = generateBatchId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^batch_/);
  });

  it("should generate unique AWB numbers", () => {
    const awb1 = generateAwbNumber();
    const awb2 = generateAwbNumber();
    
    expect(awb1).toBeDefined();
    expect(awb2).toBeDefined();
    expect(awb1).not.toBe(awb2);
    expect(awb1).toMatch(/^AWB/);
  });
});
