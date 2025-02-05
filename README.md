
# TrizyBackend

TrizyBackend is the backend for [Trizy mobile app](https://github.com/demirelarda/TrizyApp), a modern e-commerce platform providing personalized shopping experiences, product trials, AI-driven suggestions, and more. This project handles API endpoints, user authentication, product management, and more.

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [How to Get The Environment Variables](#guide-to-obtain-required-environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Deploying](#deploying)
- [API Documentation](#api-documentation)
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

## Guide to Obtain Required Environment Variables

### 1. MONGODB_URI
1.1. Go to [MongoDB](https://www.mongodb.com/) and sign up or log in.  
1.2. Create a new project or use an existing one.  
1.3. Create a new cluster.  
1.4. Choose the **free plan** or a paid plan (**M10 or Flex**), and select a provider.  
1.5. Connect your database with MongoDB:
   - Click **Connect** → Select **Drivers** → Choose **Node.js**.  
   - You'll see the connection details there.  
   - Copy the connection string and use it in your `.env` file as `MONGODB_URI`.  
   - It should look something like this:  
     ```
     mongodb+srv://arda:your_pass_will_be_here@trizycluster.abcd.mongodb.net/?retryWrites=true&w=majority&appName=TrizyCluster
     ```

---

### 2. SECRET, JWT_SEC, JWT_REFRESH_SEC
You need to generate secret keys for security.  

2.1. You can generate these secret keys using **Python**:  
   - Clone this [Secret Key Generator project](https://github.com/demirelarda/SecretKeyGenerator).  
   - Run the following command in your terminal:  
     ```bash
     python3 secretKeyGenerator.py
     ```
   - This will generate random secure keys.

2.2. Alternatively, you can use online tools (search for **Base64 key generator**), but it’s **recommended** to generate them locally for security reasons.  

2.3. You can also run the script in an online IDE or [Google Colab](https://colab.research.google.com/drive/1ewpStRV5oGHaYP3c14dFu4t8yKYeBpkC?usp=sharing).  

---

### 3. Stripe Keys
3.1. **Create a Stripe account** → [Sign up here](https://dashboard.stripe.com/register).  
3.2. **Skip business details** (optional, since we will be using test mode).  
3.3. **Enable Test Mode**:  
   - You’ll see your **Publishable Key** and **Secret Key** on the homepage.  
   - Use:
     - **Publishable Key** → In the Flutter app’s `.env`.  
     - **Secret Key** → In the backend `.env`.  

#### Setting Up Subscription Payments:
3.4. **Create a subscription product**:  
   - Go to **Product Catalog** in Stripe Dashboard.  
   - Create a **new product** (e.g., `TrizyPlus`).  
   - Once created, you’ll see the **Price ID** (e.g., `price_1QbEE7039QmbABX77JlEKJKH`).  
   - Use that ID for `STRIPE_MONTHLY_SUBSCRIPTION_PRICE_ID` in the `.env`.  

#### Setting Up Webhooks:
3.5. **Create a new webhook**:  
   - Go to the [Stripe Webhooks Page](https://dashboard.stripe.com/test/workbench/webhooks/create).  
   - Set the **Webhook Endpoint URL** correctly.  
   - The backend listens for webhook events at:  
     ```
     https://trizy-example.up.railway.app/api/payments/webhook
     ```
3.6. **Get the Webhook Signing Secret**:  
   - Use this value for `STRIPE_WEBHOOK_SECRET` in the `.env`.

---

### 4. Gemini AI (Google AI API)
4.1. Visit the [Gemini API Page](https://ai.google.dev/gemini-api/docs/api-key).  
4.2. **Generate an API Key** and add it to your `.env` file:  
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

---

### 5. Redis (Optional)
5.1. **Redis improves server performance** by caching frequently used data.  
5.2. To set up Redis, you’ll need to configure a Redis database.  
5.3. If you don’t want to use Redis, **disable it** by setting:  
   ```
   USE_REDIS=false
   ```
   in your `.env` file.

---

## 🔹 Notes:
- **Stripe Test Cards**: When testing payments, use [Stripe's test card numbers](https://docs.stripe.com/testing#cards), such as:
  ```
  4242 4242 4242 4242 (Visa, no authentication required)
  ```
- **Order Status Behavior**:
  - After making a purchase, your order status will be **"pending"**.
  - If using **your own server setup**, you can **update order status manually** via the **admin panel** (to be released soon).
  - If **not using your own setup**, the order status will automatically change to **"delivered"** within **2 days**.

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

5. **(Optional)**:
   Stop the server and run this command in the terminal:
   ```bash
   node categorySeeder.js
   ```
   This will create the initial ready made categories for the app.


---

## Running Locally

1. Ensure MongoDB and Redis(if it's enabled.) are running on your machine or are accessible via their respective URIs.
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


## API Documentation
- [View API Documentation on Postman](https://documenter.getpostman.com/view/23484413/2sAYX6p1xQ)
- A more detailed version may be added in the future.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
