if (process.env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be "test" to run the test suite');
}
