export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
    ],
};
