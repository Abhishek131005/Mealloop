import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import {useState} from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { motion } from 'framer-motion';

// Import images properly for Vite
import ourMissionImg from '../assets/our_mission.jpg';
import howItWorksImg from '../assets/how_it_works.png';
import joinMissionImg from '../assets/join_the_mission.jpg';

const carouselData = [
  {
    title: "Our Mission",
    description: "At MealLoop, we aim to reduce food waste by connecting people who have extra food with those in need.",
    image: ourMissionImg
  },
  {
    title: "How It Works",
    description: "Donors post leftover food, volunteers pick it up, and together we ensure no meal goes to waste.",
    image: howItWorksImg
  },
  {
    title: "Join the Movement",
    description: "Become a part of a caring community and earn karma points for each successful delivery.",
    image: joinMissionImg
  }
];

export default function HomePage() {
  const [index, setIndex] = useState(0);

  const handleNext = () => setIndex((index + 1) % carouselData.length);
  const handlePrev = () => setIndex((index - 1 + carouselData.length) % carouselData.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
    >
    <div>
      {/* <Navbar /> */}
      <Hero />

      {/* About Us Carousel */}
      <section className="py-16 px-6 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">About Us</h2>

        <div className="relative max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="w-full aspect-video overflow-hidden">
          <img src={carouselData[index].image} alt={carouselData[index].title} className="w-full h-full object-cover"/>
        </div>
          <div className="p-6">
            <h3 className="text-2xl font-semibold mb-2 text-gray-800">{carouselData[index].title}</h3>
            <p className="text-gray-700">{carouselData[index].description}</p>
          </div>

          {/* Controls */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
            <button onClick={handlePrev} className="text-2xl bg-white text-gray-700 rounded-full p-2 shadow hover:bg-gray-200 transition-colors duration-300">&#8592;</button>
          </div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <button onClick={handleNext} className="text-2xl bg-white text-gray-700 rounded-full p-2 shadow hover:bg-gray-200 transition-colors duration-300">&#8594;</button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="bg-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Contact Us</h2>
        <p className="max-w-xl mx-auto mb-6 text-gray-600">
          Have questions or want to get involved? Reach out to our team!
        </p>
        <form className="max-w-2xl mx-auto grid gap-4">
  <input
    type="text"
    placeholder="Your Name"
    className="border p-3 rounded-md w-full text-black"
    required
  />
  <input
    type="email"
    placeholder="Your Email"
    className="border p-3 rounded-md w-full text-black"
    required
  />
  <textarea
    placeholder="Your Message"
    rows="5"
    className="border p-3 rounded-md w-full text-black"
    required
  ></textarea>
  <button
  type="submit"
  className="bg-black text-white border border-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors duration-300"
>
  Send Message
</button>
</form>

      </section>

      {/* <Footer /> */}
    </div>
    </motion.div>
  );
}