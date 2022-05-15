const productRouter = require("../../../src/controllers/product-controller");
const roleRouter = require("../../../src/controllers/role-controller");

describe("Routes", () => {
  // product routes setup ok
  it("product routes setup ok", () => {
    const routes = productRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);
    expect(routes.includes("/search")).toBe(true);
  });

  // role routes setup ok
  it("role routes setup ok", () => {
    const routes = roleRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);
    expect(routes.includes("/search")).toBe(true);
  });
});
