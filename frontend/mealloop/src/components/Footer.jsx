export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-center py-6 text-gray-600 dark:text-gray-300 border-t">
      <p className="text-sm">&copy; {new Date().getFullYear()} MealLoop. All rights reserved.</p>
      <p className="text-xs mt-1">Made with ❤️ to fight food waste.</p>
    </footer>
  );
}