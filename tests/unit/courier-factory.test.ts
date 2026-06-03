import { CourierFactory } from "../../src/factories/CourierFactory";
import { COURIER_NAMES } from "../../src/constants";
import { UnknownCourierError } from "../../src/utils/errors";

describe("Courier Factory", () => {
  it("should get UrbaneBolt adapter", () => {
    const courier = CourierFactory.getCourier(COURIER_NAMES.URBANEBOLT);
    expect(courier).toBeDefined();
    expect(courier.createShipment).toBeDefined();
    expect(courier.trackShipment).toBeDefined();
  });

  it("should get Mock courier adapter", () => {
    const courier = CourierFactory.getCourier(COURIER_NAMES.MOCKCOURIER);
    expect(courier).toBeDefined();
    expect(courier.createShipment).toBeDefined();
    expect(courier.trackShipment).toBeDefined();
  });

  it("should throw error for unknown courier", () => {
    expect(() => {
      CourierFactory.getCourier("unknown_courier");
    }).toThrow(UnknownCourierError);
  });

  it("should return supported couriers", () => {
    const supported = CourierFactory.getSupportedCouriers();
    expect(supported).toContain(COURIER_NAMES.URBANEBOLT);
    expect(supported).toContain(COURIER_NAMES.MOCKCOURIER);
  });

  it("should handle case-insensitive courier names", () => {
    const courier1 = CourierFactory.getCourier("URBANEBOLT");
    const courier2 = CourierFactory.getCourier("urbanebolt");
    
    expect(courier1).toBeDefined();
    expect(courier2).toBeDefined();
  });
});
