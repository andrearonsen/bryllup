module.exports = {
  excludes: [
     "jquery",
     "underscore",
     "bootstrap",
     "modernizr",
     "bryllup.min.js"
  ],
  paths: [
    "public/js/*.js"
  ],
  linterOptions: {
    indent: 2,
    onevar: false,
    maxlen: 85,
    strict: true,
    browser: true,
    node: true,
    predef: [
      "BRYLLUP",
      "_",
      "$"
    ]
  }
};
