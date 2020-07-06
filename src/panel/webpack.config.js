//@ts-check

"use strict";

const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  context: path.join(__dirname, "..", ".."),
  entry: "./src/panel/index.tsx",
  output: {
    path: path.join(__dirname, "..", "..", "dist", "panel"),
    filename: "index.js",
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  devtool: "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|svg|html)$/i,
        use: [
          {
            loader: "file-loader",
            options: { name: "[name].[ext]" },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};

module.exports = config;
