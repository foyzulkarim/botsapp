const jest = require("jest");
const { healthHandler } = require("../../../src/controllers/health-controller");

it("Health monitor controller", () => {
  const res = { json: jest.fn(), sendStatus: jest.fn() };
  healthHandler({}, res);
  expect(res.json.mock.calls[0][0]).toEqual({ message: "OK" });
});
