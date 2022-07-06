import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'

module.exports = {
    plugins: [
        // Автоматически создать index.html с правильным именем пакета и ссылками на наш javascript.
        new HtmlWebpackPlugin({
            template: 'html/index.html',
        }),
        // Скопируйте игровые ресурсы из нашего статического каталога в вывод веб-пакета.
        new CopyPlugin({
            patterns: [{ from: 'static', to: 'static' }],
        }),
    ],
    // Точка входа в нашу игру
    entry: './game.js',
    module: {
        rules: [
            {
                // Загрузите наши шейдеры GLSL в виде текста
                test: /.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: ['raw-loader'],
            },
            {
                // Обработайте наш машинописный текст и используйте ts-loader для его переноса в Javascript
                test: /.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extension: ['.tsx', 'ts', '.js'],
    },
}
