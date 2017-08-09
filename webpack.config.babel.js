/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import CopyWebpackPlugin from 'copy-webpack-plugin';
import OpenBrowserPlugin from 'open-browser-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import BabiliPlugin from 'babili-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import path from 'path';
import { argv } from 'optimist';
import 'babel-polyfill';

const { NODE_ENV } = process.env;
const entry = {
    app: []
};

const plugins = [
    new HtmlWebpackPlugin({
        template: 'index.html',
    }),
    new ExtractTextPlugin({
        filename: 'css/style.css',
    }),
];

if (NODE_ENV === 'development') {
    const { port } = argv;

    entry.app.push(`webpack-dev-server/client?http://localhost:${port}`);
    plugins.push(new OpenBrowserPlugin({
        url: `http://localhost:${port}`,
        ignoreErrors: true
    }));
}

let filename;
let chunkFilename;

if (NODE_ENV === 'development') {
    filename = 'js/[name].js';
    chunkFilename = 'js/[id].[name].chunk.js';
} else {
    filename = 'js/[name]-[chunkhash].js';
    chunkFilename = 'js/[id]-[chunkhash].[name].chunk.js';
}

entry.app.push(
    'babel-polyfill',
    './js/index',
);

plugins.push(new CopyWebpackPlugin([
    { from: 'static', to: '.' },
]));

if (NODE_ENV === 'production') {
    plugins.push(new BabiliPlugin());
}

module.exports = {
    entry,
    plugins,
    context: __dirname,
    output: {
        filename,
        chunkFilename,
        path: path.resolve('dist/'),
        library: 'app',
        libraryTarget: 'var'
    },
    module: {
        rules: [{
            test: /.js?$/,
            use: ['babel-loader'],
            include: path.resolve('js/')
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ['css-loader']
            })
        }]
    },
    devtool: 'source-map'
};
