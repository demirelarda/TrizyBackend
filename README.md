
# TrizyBackend

TrizyBackend is the backend for [Trizy mobile app](https://github.com/demirelarda/TrizyApp), a modern e-commerce platform providing personalized shopping experiences, product trials, AI-driven suggestions, and more. This project handles API endpoints, user authentication, product management, and more.

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Deploying](#deploying)
- API Documentation (Will be added soon)
- [License](#license)

---

## About

This backend is built to support the [Trizy mobile application](https://github.com/demirelarda/TrizyApp), it's providing APIs for features like:

- User authentication and authorization
- Product listing
- Product operations such as liking
- Deal listing
- Category listing
- Cart and order handling
- Review system
- Trial product system
- AI-powered product suggestions
- Analytics

---

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: Database
- **AWS S3 BUCKET**: Image Storage
- **NodeCron**: For periodic jobs
- **Redis**: Caching layer
- **Stripe API**: Payment gateway
- **Gemini API**: AI


---

## Environment Variables

The following environment variables are required to run this project. 
**I will make a Youtube video on how and where to get all of these variables.**

Add them to a `.env` file in the root directory:

```
# Database
MONGODB_URI=your_mongodb_connection_string

# AUTH - JWT
SECRET=your_secret_key_for_hashing_passwords
JWT_SEC=your_jwt_secret_key
JWT_REFRESH_SEC=your_jwt_refresh_secret_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_MONTHYLY_SUBSCRIPTION_PRICE_ID=your_stripe_price_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Redis
USE_REDIS=true_or_false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/demirelarda/TrizyBackend.git
   cd TrizyBackend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file**:
   Add the required environment variables as listed in the [Environment Variables](#environment-variables) section.

4. **Run the server**:
   ```bash
   npm start
   ```

   The server will be accessible at `http://localhost:5001`.

---

## Running Locally

1. Ensure MongoDB and Redis are running on your machine or are accessible via their respective URIs.
2. Start the server:
   ```bash
   npm start
   ```
3. You can use tools like Postman or cURL to test the endpoints.

---

## Deploying

You can deploy to platforms like **AWS**, **Railway**, **Heroku**, or **Vercel**. Below are deployment instructions for Railway (which is fairly easy to do):

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/demirelarda/TrizyBackend.git
   cd TrizyBackend
   ```

2. **Push to a new repository**:
   Create your own repository on GitHub and push the code there.

3. **Connect to Railway**:
   - Log in to [Railway](https://railway.app/) with GitHub.
   - Create a new project and link it to your repository.

4. **Set environment variables**:
   - Go to the "Settings" tab in your Railway project and add the required environment variables as listed in the [Environment Variables](#environment-variables) section.

5. **Deploy**:
   Railway will automatically detect your Node.js project and deploy it.



---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
