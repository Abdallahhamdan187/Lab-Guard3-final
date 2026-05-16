import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#e9333f]">404</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link to="/">
              <ArrowLeft size={16} />
              Go Back
            </Link>
          </Button>
          <Button
            asChild
            className="flex items-center gap-2 bg-[#e9333f] hover:bg-[#d12233] text-white"
          >
            <Link to="/">
              <Home size={16} />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
