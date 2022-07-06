import { merge } from 'webpack-merge'
import common from './webpack.common.js'
import path from 'path'
import ThreeMinifierPlugin from '@yushijinhun/three-minifier-webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
const threeMinifier = new ThreeMinifierPlugin()

module.exports = merge(common, {
    plugins: [
        threeMinifier, // Уменьшает наш код three.js
        new CleanWebpackPlugin(), // Очищает папку dist между сборками
    ],
    resolve: {
        plugins: [threeMinifier.resolver],
    },
    mode: 'production', // Минимизировать наш вывод
    output: {
        path: path.resolve(__dirname, 'dist'),
        // Наш вывод будет иметь уникальный хэш, который заставит наших клиентов загружать обновления, если они станут доступны позже
        filename: '[name].[fullhash:8].js',
        sourceMapFilename: '[name].[fullhash:8].map',
        chunkFilename: '[id].[fullhash:8].js',
    },
    optimization: {
        splitChunks: {
            chunks: 'all', // Разделите наш код на более мелкие фрагменты, чтобы облегчить кэширование для наших клиентов
        },
    },
})
