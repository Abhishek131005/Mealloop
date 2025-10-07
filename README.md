# MealLoop - Food Donation Platform

A full-stack web application connecting food donors with volunteers to reduce food waste and help communities.

## 🚀 Features

- **Real-time Chat**: WebSocket-powered communication between donors and volunteers
- **Interactive Maps**: Google Maps integration for location-based food donations
- **User Authentication**: Secure JWT-based authentication system
- **File Upload**: Cloudinary integration for food images
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Notifications**: Live updates for donation status and messages

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Cloudinary** for image storage
- **Multer** for file uploads

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time features
- **Google Maps API** for location services

## 📦 Project Structure

```
mealloop.v2/
├── backend/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.js          # Entry point
├── frontend/mealloop/      # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context
│   │   └── services/      # API services
│   └── public/            # Static assets
└── .github/workflows/      # CI/CD workflows
```

## 🚀 Deployment

This project is configured for deployment on **Render** with GitHub Actions CI/CD.

### Quick Deploy

1. **Fork this repository**
2. **Set up MongoDB Atlas** (free tier available)
3. **Deploy on Render** following our [Deployment Guide](./DEPLOYMENT.md)

### Detailed Instructions

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including:
- Environment variable configuration
- MongoDB Atlas setup
- Render service configuration
- GitHub Actions workflow setup

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abhishek131005/Mealloop.git
   cd Mealloop
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend/mealloop
   npm install
   ```

4. **Set up environment variables**
   
   Backend (`.env`):
   ```
   MONGO_URI=mongodb://localhost:27017/mealloop
   PORT=5000
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```
   
   Frontend (`.env`):
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

5. **Start development servers**
   
   Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend:
   ```bash
   cd frontend/mealloop
   npm run dev
   ```

## 🔧 CI/CD Pipeline

GitHub Actions workflows automatically:
- Install dependencies
- Run tests and linting
- Build applications
- Deploy to Render on push to `main`

## 🌟 Key Features Implementation

### Real-time Communication
- WebSocket implementation using Socket.IO
- Real-time chat between donors and volunteers
- Live notification system
- Presence detection (online/offline status)

### Location Services
- Google Maps integration for donation locations
- Shelter location mapping
- Distance calculation for volunteer matching

### File Management
- Cloudinary integration for image uploads
- Optimized image storage and delivery
- Secure file upload handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Abhishek Vishwakarma**
- GitHub: [@Abhishek131005](https://github.com/Abhishek131005)
- Email: 2023.abhishek.vishwakarma@ves.ac.in

## 🙏 Acknowledgments

- Thanks to all contributors and the open-source community
- Special thanks to the libraries and frameworks that made this project possible