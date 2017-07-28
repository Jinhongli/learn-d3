const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');


module.exports = {
    entry: {
        app: path.join(__dirname, 'src/app/app.js'),
        vendor: ['d3', 'chance']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name]/[name]![chunkhash].js'
    },
    devtool: 'cheap-module-eval-source-map',
    plugins: [
        new CleanWebpackPlugin(['dist', 'build'], {
            root: __dirname,
            verbose: true,
            dry: false,
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['vendor', 'manifest'] // 指定公共 bundle 的名字。
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            chunks: ['manifest', 'vendor', 'app']
        })
    ]
};
