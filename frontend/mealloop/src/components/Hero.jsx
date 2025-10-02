import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary to-secondary text-white min-h-[80vh] flex flex-col justify-center items-center px-6 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
        Bridging Hunger & Surplus, One Meal at a Time
      </h1>
      <p className="text-lg md:text-xl max-w-2xl mb-8">
        MealLoop connects generous donors with volunteers to share extra food with those who need it — creating a loop of care.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link to="/signup">
          <button className="bg-black text-white font-semibold px-6 py-3 rounded-full border border-white shadow-md hover:bg-gray-800 transition">
            Get Started
          </button>
        </Link>
        <Link to="/login">
          <button className="bg-black text-white px-6 py-3 rounded-full border border-white shadow-md hover:bg-gray-800 transition">
            Login
          </button>
        </Link>
      </div>
    </section>
  );
}