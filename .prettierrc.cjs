module.exports = {
    proseWrap: 'always',
    plugins: [require('prettier-plugin-packagejson')],
    ...require('@hedger/prettier-config'),
};
