// provider.js
// Custom Promptfoo Provider class calling Spring Boot QuickAdd API

class CustomApiProvider {
  constructor(options) {
    this.providerId = options.id || 'quick-add-api-provider';
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt) {
    try {
      const response = await fetch('http://localhost:8080/api/quick-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: prompt }),
      });

      const statusCode = response.status;
      const data = await response.json();

      return {
        output: data,
      };
    } catch (error) {
      return {
        error: `API Call Failed: ${error.message}`,
      };
    }
  }
}

module.exports = CustomApiProvider;
