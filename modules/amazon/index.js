const XRay = require('x-ray');
const xray = XRay();

module.exports.url = function(url, reply) {
  var query = {
    price: '#priceblock_ourprice',
    product_name: '#productTitle'
  };
  if (url.includes("amazon")) {
    xray(url, query)(function(err, data) {
      if (err) reply(err);
      console.log(data);
      var productName = data.product_name.replace('\n', ' ').trim();
      var price = data.price;
      reply(`${productName} - [${price}]`);
    });
  }
};

