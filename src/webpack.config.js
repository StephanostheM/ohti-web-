const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    entry: "./src/app.ts",
    output: {
        path: path.resolve(__dirname + "/../static/dist"),
        filename: "app.js",
        publicPath: "/"
    },
    resolve: {
        extensions: [".js", ".ts"]
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader"
            },
            {
                test: /\.css$/i,
                use: [
                    {
                      loader: 'file-loader',
                    },
                  ],
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
    ]
};