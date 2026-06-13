import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Oups ! Page introuvable</p>
        <p className="mb-4 text-base text-muted-foreground/80">Ukurasa haupatikani</p>
        <a href="/home" className="text-primary underline hover:text-primary/90">
          Retour à l'accueil <span className="opacity-70">/ Rudi nyumbani</span>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
