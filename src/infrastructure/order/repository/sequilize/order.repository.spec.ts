import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("Should find created order data by order id.", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const product2 = new Product("1234", "Product 2", 25);
    await productRepository.create(product2);
    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      5
    );

    const order = new Order("123", "123", [orderItem, orderItem2]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const foundedOrder = await orderRepository.find(order.id);

    expect(foundedOrder).toEqual(order);
  });

  it("Should list all created orders.", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("111", "Product 1", 10);
    await productRepository.create(product);

    const promises = Array.from({ length: 6 }).map(async (_, i) => {
      const product = new Product(`${i + 1}`, `Product ${i + 1}`, 10 * (i + 1));
      await productRepository.create(product);
      return new OrderItem(
        `${i + 1}`,
        product.name,
        product.price,
        product.id,
        i + 1
      );
    });

    const [
      orderItem1,
      orderItem2,
      orderItem3,
      orderItem4,
      orderItem5,
      orderItem6,
    ] = await Promise.all(promises);

    const order = new Order("111", "123", [orderItem1, orderItem2]);
    const order2 = new Order("222", "123", [orderItem3, orderItem4]);
    const order3 = new Order("333", "123", [orderItem5, orderItem6]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    await orderRepository.create(order2);
    await orderRepository.create(order3);

    const orderList = await orderRepository.findAll();

    expect(orderList).toHaveLength(3);
    expect(orderList).toEqual([order, order2, order3]);
  });

  it("Should update created order.", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("111", "Product 1", 10);
    await productRepository.create(product);

    const promises = Array.from({ length: 6 }).map(async (_, i) => {
      const product = new Product(`${i + 1}`, `Product ${i + 1}`, 10 * (i + 1));
      await productRepository.create(product);
      return new OrderItem(
        `${i + 1}`,
        product.name,
        product.price,
        product.id,
        i + 1
      );
    });

    const [
      orderItem1,
      orderItem2,
      orderItem3,
      orderItem4,
      orderItem5,
      orderItem6,
    ] = await Promise.all(promises);

    const order = new Order("111", "123", [orderItem1, orderItem2, orderItem3]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const updatedOrder = new Order("111", "123", [orderItem4, orderItem5, orderItem6]);

    await orderRepository.update(updatedOrder)

    const foundedUpdatedOrder = await orderRepository.find(order.id);

    expect(foundedUpdatedOrder).toEqual(updatedOrder);
  });
});
