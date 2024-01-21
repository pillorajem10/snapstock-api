const Delivery = require('../models/Delivery.js');
const Product = require('../models/Product.js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const base64Img = require('base64-img');
const excel = require('exceljs');
const numeral = require('numeral');

const { sendError, sendSuccess, convertMomentWithFormat, getToken, sendErrorUnauthorized } = require ('../utils/methods');

//LIST ALL PRODUCTS
exports.list = (req, res, next) => {
    const { pageIndex, pageSize, sort_by, sort_direction, productName } = req.query;

    console.log("REQ QUERYY", req.query)

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

    const deliveryFieldsFilter = {
      stock : req.query.minimumPrice,
      monthDelivered: req.query.monthDelivered ? +req.query.monthDelivered : undefined,
      dateDelivered: req.query.dateDelivered ? +req.query.dateDelivered : undefined,
      yearDelivered: req.query.yearDelivered ? +req.query.yearDelivered : undefined,
      // $text: req.query.productName ? { $search: req.query.productName } : undefined,
    };

    if (productName) {
      deliveryFieldsFilter.productName = { $regex: productName, $options: 'i' }; // Case-insensitive regex search
    }

    // Will remove a key if that key is undefined
    Object.keys(deliveryFieldsFilter).forEach(key => deliveryFieldsFilter[key] === undefined && delete deliveryFieldsFilter[key]);

    const filterOptions = [
      { $match: deliveryFieldsFilter },
      { $sort: { createdAt: -1 } },
    ];

    const aggregateQuery = Delivery.aggregate(filterOptions);

    Delivery.aggregatePaginate(aggregateQuery,
      sortPageLimit,
      (err, result) => {
      if (err) {
        console.log("ERRoRRRRRRRRRRRRRRRRR", err)
        return sendError(res, err, 'Server Failed');
      } else {
        return sendSuccess(res, result);
      }
    });
};



exports.downloadPDF = async (req, res, next) => {
  const { orderList, fomattedDateNow } = req.body;


  try {
    // Construct the full path to the image
    const imagePath = path.join(__dirname, '../templates/snapstocklogo.png');

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
    const templatePath = path.join(__dirname, '../templates/deliveryPdfTemplate.html');

    // Read the HTML template
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    // Compile the HTML template using Handlebars
    const template = handlebars.compile(templateHtml);

    // Use the template to generate HTML with formatted prices
    const html = template({
      orderList,
      fomattedDateNow,
      logoBase64,
    });

    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Close the browser
    await browser.close();

    // Respond with success
    res.setHeader('Content-Disposition', `attachment; filename=Res-stock_Inventory_Report_${fomattedDateNow}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(pdfBuffer);

  } catch (error) {
    // Handle errors
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error,
      message: 'Error generating PDF report.',
    });
  }
};


exports.downloadExcel = async (req, res) => {
  const { orderList, fomattedDateNow } = req.body;

  try {
    // Create a new workbook
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Deliveries');

    // Add an image to the worksheet
    const imageLink = 'D:\\Projects\\snapstock-api\\app\\templates\\snapstocklogo.png'; // Replace with the actual path to your image
    const imageId = workbook.addImage({
      filename: imageLink,
      extension: 'png',
    });
    worksheet.addImage(imageId, 'A1:A4'); // Adjust the cell range as needed

    const titileRow =worksheet.addRow(['Re-stock Inventory Report:', '', fomattedDateNow]);
    titileRow.font = { bold: true, size: 14 };
    titileRow.getCell(3).alignment = { horizontal: 'left' };
    worksheet.addRow([]);

    // Add headers to the worksheet with bold font
    const headerRow = worksheet.addRow(['Product Name', 'Quantity added', 'Date of re-stocking']);
    headerRow.font = { bold: true };
    headerRow.getCell(3).alignment = { horizontal: 'left' };

    // Add data to the worksheet
    orderList.forEach((order) => {
      const { productName, qty, monthDelivered, dateDelivered ,yearDelivered } = order;

      // Add rows with specified alignment for "Stock" and "Price" columns
      const row = worksheet.addRow([productName, qty, `${monthDelivered}/${dateDelivered}/${yearDelivered}`]);
      row.getCell(2).alignment = { horizontal: 'left' };
      row.getCell(3).alignment = { horizontal: 'left' };
    });


    // Adjust the width of the columns
    worksheet.columns.forEach((column) => {
      column.width = 50; // Adjust the width as needed
    });


    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=Re-stock_Inventory_Report_${fomattedDateNow}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the workbook as the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    // Handle errors
    console.error('Error generating Excel report:', error);
    res.status(500).json({
      success: false,
      error,
      message: 'Error generating Excel report.',
    });
  }
};



//CREATE PRODUCT
exports.add = (req, res, next) => {
  console.log("ADDING PRODDUCTSSSSSSSSSSSSSSSSSS");
  Delivery.create(req.body, function (err, delivery) {
    if (err) {
      return sendError(res, err, 'Add delivery failed')
    } else {
      Product.findById(req.body.productId, function (err, product) {
        if (err || !product) {
          return sendError(res, err, 'Cannot get product')
        } else {
          const convertedDate = convertMomentWithFormat(delivery.createdAt);
          const month = +convertedDate.split('/')[0];
          const date = +convertedDate.split('/')[1];
          const year = +convertedDate.split('/')[2];

          delivery.monthDelivered = month;
          delivery.dateDelivered = date;
          delivery.yearDelivered = year;

          delivery.total = product.price * delivery.qty;
          delivery.productName = product.name;

          product.stocks = product.stocks + delivery.qty;


          product.save();
          delivery.save();

          return sendSuccess(res, delivery)
        }
      });
    }
  });
}






//GET BY ID
exports.getById = (req, res, next) => {
  Delivery.findById(req.params.id).populate('productId').exec((err, delivery) => {
    if(err || !delivery){
      return sendSuccess(res, delivery)
    } else {
      return sendSuccess(res, delivery)
    }
  });
}






//UPDATE BY ID
exports.updateById = (req, res, next) => {
  Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true } ).populate('productId').exec((err, delivery) => {
    console.log("REQ BODYYYYYYYYYYYYYY", req.body)
    if(err || !delivery){
      return sendSuccess(res, delivery)
    } else {
      return sendSuccess(res, delivery)
    }
  });
}




// DELETE BY ID
exports.deleteById = (req, res, next) => {
  Delivery.findByIdAndRemove(req.params.id, req.body, function (err, delivery) {
    if (err || !delivery) {
      return sendError(res, {}, 'Cannot delete delivery');
    } else {
      const productId = delivery.productId;
      const qty = delivery.qty;

      // Find the product and update the stocks by subtracting the quantity
      Product.findById(productId, function (err, product) {
        if (err || !product) {
          return sendError(res, err, 'Cannot get product');
        } else {
          product.stocks = Math.max(0, product.stocks - qty);
          product.save();
        }
      });

      return sendSuccess(res, delivery, 'Re-stock product deleted successfully');
    }
  });
}
