const Order = require('../models/Order.js');
const OrderItem = require('../models/OrderItem.js');
const Product = require('../models/Product.js');
const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const base64Img = require('base64-img');
const excel = require('exceljs');
const numeral = require('numeral');
const jwt = require('jsonwebtoken');
const pdf = require("html-pdf");

const {
  sendError,
  sendSuccess,
  convertMomentWithFormat,
  getToken,
  sendErrorUnauthorized,
  formatPriceX,
} = require("../utils/methods");

//LIST ALL ORDERS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const { pageIndex, pageSize, sort_by, sort_direction, customerName } =
      req.query;
    const page = pageIndex;
    const limit = pageSize;
    const sortDirection = sort_direction
      ? sort_direction.toLowerCase()
      : undefined;

    let sortPageLimit = {
      page,
      limit,
    };

    if (sort_by && sortDirection) {
      sortPageLimit = {
        sort: { [sort_by]: sortDirection },
        page,
        limit,
      };
    }

    let categIds =
      req.query.category &&
      req.query.category.split(",").map(function (categ) {
        return mongoose.Types.ObjectId(categ);
      });

    const orderFieldsFilter = {
      stock:
        req.query.minimumStock && req.query.maximumStock
          ? { $gte: +req.query.minimumStock, $lte: +req.query.maximumStock }
          : undefined,
      monthOrdered: req.query.monthOrdered
        ? +req.query.monthOrdered
        : undefined,
      dateOrdered: req.query.dateOrdered ? +req.query.dateOrdered : undefined,
      yearOrdered: req.query.yearOrdered ? +req.query.yearOrdered : undefined,
      category: req.query.category ? { $in: categIds } : undefined,
      // $text: req.query.customerName ? { $search: req.query.customerName } : undefined,
    };

    if (customerName) {
      orderFieldsFilter.customerName = { $regex: customerName, $options: "i" }; // Case-insensitive regex search
    }

    // Will remove a key if that key is undefined
    Object.keys(orderFieldsFilter).forEach(
      (key) =>
        orderFieldsFilter[key] === undefined && delete orderFieldsFilter[key]
    );

    const filterOptions = [{ $match: orderFieldsFilter }];

    const aggregateQuery = Order.aggregate(filterOptions);

    Order.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
      if (err) {
        return sendError(res, err, "Server Failed");
      } else {
        return sendSuccess(res, result);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};

exports.downloadExcel = async (req, res) => {
  const { orderList, fomattedDateNow, totalOrder } = req.body;

  try {
    // Create a new workbook
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // Add an image to the worksheet
    const imageLink = path.join(__dirname, "../templates/snapstocklogo.png");
    const imageId = workbook.addImage({
      filename: imageLink,
      extension: "png",
    });
    worksheet.addImage(imageId, "A1:A4"); // Adjust the cell range as needed

    worksheet.addRow(["Orders report:", "", fomattedDateNow]).font = {
      bold: true,
      size: 14,
    };
    worksheet.addRow([]);

    // Add headers to the worksheet with bold font
    const headerRow = worksheet.addRow(["Ordered By", "Date Ordered", "Total"]);
    headerRow.font = { bold: true };

    // Add data to the worksheet
    orderList.forEach((order) => {
      const {
        customerName,
        monthOrdered,
        dateOrdered,
        yearOrdered,
        totalPrice,
      } = order;
      const formattedTotalPrice = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(totalPrice);
      worksheet.addRow([
        customerName,
        `${monthOrdered}/${dateOrdered}/${yearOrdered}`,
        formattedTotalPrice,
      ]);
    });

    // Skip two rows before adding totalOrder
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Add totalOrder to the worksheet with bold font, aligned to the right, and red font color
    const totalRow = worksheet.addRow(["Total for the day:", "", totalOrder]);
    totalRow.font = { bold: true, color: { argb: "FF0000" } }; // Set font color to red
    totalRow.getCell(1).alignment = { horizontal: "left" }; // Align label to the left
    totalRow.getCell(3).alignment = { horizontal: "right" }; // Align total order to the right

    // Adjust the width of the columns
    worksheet.columns.forEach((column) => {
      column.width = 50; // Adjust the width as needed
    });

    // Adjust the alignment of the "Total" column to the right
    worksheet.getColumn(3).alignment = { horizontal: "right" };

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Orders_Report_${fomattedDateNow}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the workbook as the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      error,
      message: "Error generating Excel report.",
    });
  }
};

exports.downloadPDF = async (req, res, next) => {
  const { orderList, totalOrder, fomattedDateNow } = req.body;

  try {
    // Format the "totalPrice" or "total" in each order before passing it to the template
    const formattedOrderList = orderList.map((order) => ({
      ...order,
      totalPrice: formatPriceX(order.totalPrice), // Format total with peso sign
    }));

    // Format totalOrder with peso sign
    const formattedTotalOrder = numeral(totalOrder).format("₱0,0.00");

    // Construct the full path to the image
    const imagePath = path.join(__dirname, "../templates/snapstocklogo.png");

    // Convert image to base64
    const logoBase64 = await new Promise((resolve, reject) => {
      base64Img.base64(imagePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // Construct the full path to the HTML template
    const templatePath = path.join(
      __dirname,
      "../templates/ordersPdfTemplate.html"
    );

    // Read the HTML template
    const templateHtml = fs.readFileSync(templatePath, "utf-8");

    // Compile the HTML template using Handlebars
    const template = handlebars.compile(templateHtml);

    // Use the template to generate HTML with formatted prices
    const html = template({
      orderList: formattedOrderList,
      totalOrder,
      fomattedDateNow,
      logoBase64,
    });

    /*
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });


    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Close the browser
    await browser.close();

    // Respond with success
    res.setHeader('Content-Disposition', `attachment; filename=Orders_Report_${fomattedDateNow}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(pdfBuffer);
    */

    // Options for html-pdf
    const pdfOptions = {
      format: "Letter",
      border: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    };

    // Generate PDF using html-pdf
    pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        // Respond with success
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=Orders_Report_${fomattedDateNow}.pdf`
        );
        res.setHeader("Content-Type", "application/pdf");
        res.status(200).send(buffer);
      }
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      error,
      message: "Error generating PDF report.",
    });
  }
};





//LIST OF ORDER ITEMS PER ID
exports.listOrderItems = (req, res, next) => {
    let token = getToken(req.headers);
    if (token) {
      const { pageIndex, pageSize, sort_by, sort_direction } = req.query;

      const page = pageIndex;
      const limit = pageSize;
      const sortDirection = sort_direction ? sort_direction.toLowerCase() : undefined;

      let sortPageLimit = {
        page,
        limit
      };

      if (sort_by && sortDirection) {
        sortPageLimit = {
          sort: { [sort_by] : sortDirection },
          page,
          limit,
        };
      }

      const orderFieldsFilter = {
        orderId: new mongoose.Types.ObjectId(req.query.orderId),
        $text: req.query.name ? { $search: req.query.name } : undefined,
      };

      // Will remove a key if that key is undefined
      Object.keys(orderFieldsFilter).forEach(key => orderFieldsFilter[key] === undefined && delete orderFieldsFilter[key]);

      const filterOptions = [
        { $match: orderFieldsFilter },
      ];

      const aggregateQuery = OrderItem.aggregate(filterOptions);

      OrderItem.aggregatePaginate(aggregateQuery,
        sortPageLimit,
        (err, result) => {
        if (err) {
          return sendError(res, err, 'Server Failed');
        } else {
          return sendSuccess(res, result);
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "Please login first.")
    }
};







//CREATE ORDER
exports.add = (req, res, io) => {
  let token = getToken(req.headers);
  if (token) {
    const decodedToken = jwt.decode(token);
    const currentDate = new Date();
    Order.create(req.body, function (err, order) {
      if (err) {
        return sendError(res, err, 'Add order failed');
      } else {
        const convertedDate = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' });

        const month = currentDate.getMonth() + 1; // getMonth is zero-based
        const date = currentDate.getDate();
        const year = currentDate.getFullYear();

        order.monthOrdered = month;
        order.dateOrdered = date;
        order.yearOrdered = year;

        order.credit = 'false';

        order.save();

        // Save the notification in the database
        const notification = new Notification({
          category: decodedToken.user.category,
          message: `${decodedToken.user.fname} added an order`
        });

        notification.save();

        if (io) {
          io.to(decodedToken.user.category).emit('newOrder', `${decodedToken.user.fname} added an order`, (error) => {
            if (error) {
                console.error('Emit failed:', error);
            } else {
                console.log('Emit successful');
            }
          });
        }

        return sendSuccess(res, order);
      }
    });
  } else {
    return sendErrorUnauthorized(res, '', 'Please login first.');
  }
};

//GET BY ID
exports.getById = (req, res, next)=>{
  let token = getToken(req.headers);
  if (token) {
    Order.findById(req.params.id).populate('orderItem').exec((err, order) => {
      if(err || !order){
        return sendSuccess(res, order)
      } else {
        return sendSuccess(res, order)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};


//UPDATE BY ID
exports.updateById = (req, res, next)=>{
  let token = getToken(req.headers);
  if (token) {
    Order.findByIdAndUpdate(req.params.id, req.body, { new: true } ).populate('orderItem').exec((err, order) => {
      if(err || !order){
        return sendError(res, null, 'Unable to find order.')
      } else {
        return sendSuccess(res, order, 'Order update success.')
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};




//DELETE BY ID
exports.deleteById = async (req, res, next) => {
  try {
    const token = getToken(req.headers);

    if (!token) {
      return sendErrorUnauthorized(res, '', 'Please login first.');
    }

    const orderId = req.params.id;

    // Retrieve the order and populate the 'orderItems' field
    const order = await Order.findById(orderId).populate('orderItem').exec();

    if (!order) {
      return sendError(res, {}, 'Cannot find order for deletion.');
    }

    // Extract order item IDs
    const orderItemIds = order.orderItem.map(item => item._id);

    // Delete order and associated order items
    await Promise.all([
      Order.findByIdAndRemove(orderId).exec(),
      OrderItem.deleteMany({ _id: { $in: orderItemIds } }).exec()
    ]);

    // Iterate through order items to update product stocks
    for (const orderItem of order.orderItem) {
      const product = await Product.findById(orderItem.productId).exec();

      if (product) {
        // Increase product stocks by the order item quantity
        product.stocks += orderItem.qty;
        await product.save();
      }
    }

    return sendSuccess(res, {}, 'Order and associated items deleted successfully.');
  } catch (err) {
    return sendError(res, err, 'Error deleting order and associated items.');
  }
};








// ADD AN ORDER ITEM
exports.addOrderItem = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const orderItem = new OrderItem(req.body);

    Order.findByIdAndUpdate(req.params.id).populate('orderItem').exec((err, callbackOrder) => {
        if(err || !callbackOrder){
          return sendError(res, err, 'Order not found.')
        } else {

          Product.findById(req.body.productId, function (err, product) {
            if (err || !product) {
              return sendError(res, err, 'Cannot get product')
            } else {

              if (product.stocks < orderItem.qty) {
                return sendError(res, err, 'Sorry this product is short for stocks to fulfill your quantity')
              } else {
                callbackOrder.orderItem.push(orderItem);

                orderItem.total = product.price * orderItem.qty;
                orderItem.productName = product.name;
                orderItem.credit = 'false';

                callbackOrder.totalPrice = callbackOrder.totalPrice + orderItem.total;

                product.stocks = product.stocks - orderItem.qty;


                product.save();
                orderItem.save();
                callbackOrder.save();

                return sendSuccess(res, callbackOrder, 'Order item added successfully.')
              }
            }
          });

          // return sendSuccess(res, callbackOrder);
        }
      })
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};

exports.getOrderItemById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    OrderItem.findById(req.params.id, function (err, orderItem) {
      if (err || !orderItem) {
        return sendError(res, err, 'Cannot get order item')
      } else {
        return sendSuccess(res, orderItem)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}

exports.deleteOrderItem = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Order.findById(req.params.orderId)
      .populate('orderItem')
      .exec((err, callbackOrder) => {
        if (err || !callbackOrder) {
          return sendError(res, err, 'Order not found.');
        }

        const orderItemId = req.params.orderItemId;
        const orderItem = callbackOrder.orderItem.find((item) => item._id.equals(orderItemId));

        if (!orderItem) {
          return sendError(res, null, 'Order item not found.');
        }

        Product.findById(orderItem.productId, (err, product) => {
          if (err || !product) {
            return sendError(res, err, 'Cannot get product');
          }

          // Use findByIdAndDelete to delete the OrderItem and handle the callback
          OrderItem.findByIdAndDelete(orderItemId, (err) => {
            if (err) {
              return sendError(res, err, 'Error deleting order item.');
            }

            // Update product stocks
            product.stocks = product.stocks + orderItem.qty;
            product.save();

            // Update order total price
            callbackOrder.totalPrice = callbackOrder.totalPrice - orderItem.total;

            // Remove the order item from the array
            callbackOrder.orderItem.pull(orderItemId);

            // Save changes to the Order collection
            callbackOrder.save((err) => {
              if (err) {
                return sendError(res, err, 'Error updating order.');
              }

              return sendSuccess(res, callbackOrder, 'Order Updated Completely');
            });
          });
        });
      });
  } else {
    return sendErrorUnauthorized(res, '', 'Please login first.');
  }
};



exports.updateOrderItem = async (req, res, next) => {
  try {
    const token = getToken(req.headers);

    if (!token) {
      return sendErrorUnauthorized(res, '', 'Please login first.');
    }

    const orderId = req.params.orderId;
    const orderItemId = req.params.orderItemId;
    const { productId, qty } = req.body;

    const callbackOrder = await Order.findById(orderId).populate('orderItem').exec();

    if (!callbackOrder) {
      return sendError(res, null, 'Order not found.');
    }

    const orderItem = callbackOrder.orderItem.find((item) => item._id.equals(orderItemId));

    if (!orderItem) {
      return sendError(res, null, 'Order item not found.');
    }

    const currentProduct = await Product.findById(orderItem.productId).exec();

    if (!currentProduct) {
      return sendError(res, null, 'Cannot get the current product');
    }

    // Calculate the difference in quantity
    const qtyDifference = qty - orderItem.qty;

    // Check if the quantity is valid for the current product
    if (qty > currentProduct.stocks + orderItem.qty || qty < 0) {
      return sendError(res, null, 'Sorry but the stocks for this product is too low for your desired quantity.');
    }

    // Revert previous stock changes
    currentProduct.stocks += orderItem.qty;
    await currentProduct.save();

    if (productId !== orderItem.productId) {
      const newProduct = await Product.findById(productId).exec();

      if (!newProduct || newProduct.stocks < qty) {
        return sendError(res, null, 'Not enough stocks for the new product. Order can\'t be processed; the stocks for this product are too low.');
      }

      // Apply stock changes for the new product
      newProduct.stocks -= qty;
      await newProduct.save();

      orderItem.productId = productId;
      orderItem.productName = newProduct.name;
    } else {
      // Apply stock changes for the current product
      currentProduct.stocks -= qty;
      await currentProduct.save();
    }

    // Update order item details
    orderItem.qty = qty;
    orderItem.total = currentProduct.price * qty;

    // Update total price in the order
    callbackOrder.totalPrice += qtyDifference * currentProduct.price;

    // Save changes
    await Promise.all([orderItem.save(), callbackOrder.save()]);

    return sendSuccess(res, callbackOrder, 'Order Item Updated Completely');
  } catch (err) {
    return sendError(res, err, 'Error updating order item or order.');
  }
};
