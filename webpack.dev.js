import { merge } from 'webpack-merge'
import common from './webpack.common.js'
import path from 'path'

module.exports = merge(common, {
    mode: 'development', // Не уменьшайте исходный код
    devtool: 'eval-source-map', // Исходная карта для облегчения разработки
    devServer: {
        static: {
            directory: path.join(__dirname, './dist'), // Подавать статические файлы отсюда
        },
        hot: true, // Перезагрузите нашу страницу при изменении кода
    },
})
