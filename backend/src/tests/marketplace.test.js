import request from "supertest";

import { ADMIN } from "../constants/roles.js";
import { bearerToken } from "./helpers/auth.js";
import { getTestApp } from "./helpers/testApp.js";
import { marketplaceFixtures } from "./fixtures/marketplace.js";
import {
  createOrder,
  createPayment,
  createProduct,
  createUniqueEmail,
  createUser,
} from "./helpers/factories.js";

describe("Module 4: Marketplace", () => {
  let app;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test("35. Get all products returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Product List Admin",
      email: createUniqueEmail("product-list-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    await createProduct(adminUser._id, marketplaceFixtures.productPayload);

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body.products.length).toBe(1);
  });

  test("36. Get single product returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Single Product Admin",
      email: createUniqueEmail("single-product-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    const response = await request(app).get(`/api/products/${product._id}`);

    expect(response.status).toBe(200);
    expect(response.body._id.toString()).toBe(product._id.toString());
  });

  test("37. Admin creates product returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Create Product Admin",
      email: createUniqueEmail("create-product-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/products/admin")
      .set("Authorization", bearerToken(adminUser))
      .send({
        ...marketplaceFixtures.productPayload,
        name: "Admin Created Product",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Admin Created Product");
  });

  test("38. Get cart returns success", async () => {
    const { user } = await createUser({
      name: "Get Cart User",
      email: createUniqueEmail("get-cart-user"),
      isVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .get("/api/cart")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.userId.toString()).toBe(user._id.toString());
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  test("39. Add item to cart returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Add Cart Admin",
      email: createUniqueEmail("add-cart-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Add Cart User",
      email: createUniqueEmail("add-cart-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    const response = await request(app)
      .post("/api/cart/items")
      .set("Authorization", bearerToken(user))
      .send({
        productId: product._id.toString(),
        quantity: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/item added to cart/i);
    expect(response.body.cart.items.length).toBe(1);
  });

  test("40. Update cart quantity returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Update Cart Admin",
      email: createUniqueEmail("update-cart-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Update Cart User",
      email: createUniqueEmail("update-cart-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", bearerToken(user))
      .send({
        productId: product._id.toString(),
        quantity: 1,
      });

    const response = await request(app)
      .put(`/api/cart/items/${product._id}`)
      .set("Authorization", bearerToken(user))
      .send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/cart updated/i);
    expect(response.body.cart.items[0].quantity).toBe(3);
  });

  test("41. Remove item from cart returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Remove Cart Admin",
      email: createUniqueEmail("remove-cart-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Remove Cart User",
      email: createUniqueEmail("remove-cart-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", bearerToken(user))
      .send({
        productId: product._id.toString(),
        quantity: 1,
      });

    const response = await request(app)
      .delete(`/api/cart/items/${product._id}`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/item removed from cart/i);
    expect(response.body.cart.items).toHaveLength(0);
  });

  test("42. Clear cart returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Clear Cart Admin",
      email: createUniqueEmail("clear-cart-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Clear Cart User",
      email: createUniqueEmail("clear-cart-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", bearerToken(user))
      .send({
        productId: product._id.toString(),
        quantity: 2,
      });

    const response = await request(app)
      .delete("/api/cart/clear")
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/cart cleared/i);
    expect(response.body.cart.items).toHaveLength(0);
  });

  test("43. Create order returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Create Order Admin",
      email: createUniqueEmail("create-order-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Create Order User",
      email: createUniqueEmail("create-order-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", bearerToken(user))
      .send({
        productId: product._id.toString(),
        quantity: 2,
      });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", bearerToken(user))
      .send(marketplaceFixtures.orderPayload);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("pending");
    expect(response.body.items.length).toBe(1);
  });

  test("44. Cancel order returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Cancel Order Admin",
      email: createUniqueEmail("cancel-order-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Cancel Order User",
      email: createUniqueEmail("cancel-order-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", bearerToken(user))
      .send({
        productId: product._id.toString(),
        quantity: 1,
      });

    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", bearerToken(user))
      .send(marketplaceFixtures.orderPayload);

    const response = await request(app)
      .put(`/api/orders/${createResponse.body._id}/cancel`)
      .set("Authorization", bearerToken(user));

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/order cancelled successfully/i);
    expect(response.body.order.status).toBe("cancelled");
  });

  test("45. Confirm order payment returns success", async () => {
    const { user: adminUser } = await createUser({
      name: "Confirm Payment Admin",
      email: createUniqueEmail("confirm-payment-admin"),
      roles: ADMIN,
      serviceType: "marketplace",
      isVerified: true,
      isActive: true,
    });

    const { user } = await createUser({
      name: "Confirm Payment User",
      email: createUniqueEmail("confirm-payment-user"),
      isVerified: true,
      isActive: true,
    });

    const product = await createProduct(
      adminUser._id,
      marketplaceFixtures.productPayload,
    );
    const payment = await createPayment({
      amount: product.price,
      method: "khalti",
    });

    const order = await createOrder(
      user._id,
      {
        productId: product._id,
        quantity: 1,
        priceSnapshot: product.price,
        nameSnapshot: product.name,
        imageSnapshot: null,
      },
      {
        paymentMethod: "khalti",
        payment: payment._id,
        status: "pending",
      },
    );

    const response = await request(app)
      .put(`/api/orders/${order._id}/confirm-payment`)
      .set("Authorization", bearerToken(user))
      .send({ status: "Completed" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("confirmed");
  });
});
