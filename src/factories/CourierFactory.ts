import { CourierProvider } from "../types";
import { UrbaneboltAdapter } from "../adapters/urbanebolt/urbanebolt.adapter";
import { MockCourierAdapter } from "../adapters/mockcourier/mockcourier.adapter";
import { UnknownCourierError } from "../utils/errors";
import { COURIER_NAMES } from "../constants";
// import { config } from "../config";
import { loggerService } from "../services/logger.service";

/**
 * Courier Factory - Returns appropriate courier adapter based on name
 * Implements Factory Pattern
 */
export class CourierFactory {
  // private static adapters: Map<string, () => CourierProvider> = new Map([
  //   [COURIER_NAMES.URBANEBOLT, () => new UrbaneboltAdapter()],
  //   [COURIER_NAMES.MOCKCOURIER, () => new MockCourierAdapter()],
  // ]);
  private static adapters = new Map<string, () => CourierProvider>([
    [
      COURIER_NAMES.URBANEBOLT,
      (): CourierProvider => new UrbaneboltAdapter(),
    ],
    [
      COURIER_NAMES.MOCKCOURIER,
      (): CourierProvider => new MockCourierAdapter(),
    ],
  ]);

  static getCourier(courierName: string): CourierProvider {
    const normalizedName = courierName.toLowerCase();

    if (!this.adapters.has(normalizedName)) {
      loggerService.error("Unknown courier requested", new Error("Unknown courier"), {
        courier: normalizedName,
      });
      throw new UnknownCourierError(courierName);
    }

    const adapterFactory = this.adapters.get(normalizedName)!;
    const adapter = adapterFactory();

    loggerService.debug("Courier adapter created", { courier: normalizedName });
    return adapter;
  }

  static registerAdapter(
    courierName: string,
    adapterFactory: () => CourierProvider
  ): void {
    this.adapters.set(courierName.toLowerCase(), adapterFactory);
    loggerService.info("Courier adapter registered", { courier: courierName });
  }

  static getSupportedCouriers(): string[] {
    return Array.from(this.adapters.keys());
  }
}
