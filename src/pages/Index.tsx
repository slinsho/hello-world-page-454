import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <main className="text-center space-y-8 max-w-4xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-8xl md:text-9xl font-bold tracking-tighter text-gradient opacity-0 animate-fade-in-up">
            hello
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in-up animate-delay-200">
            Welcome to something beautiful. Let's build something amazing together.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up animate-delay-400">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 font-semibold px-8"
          >
            Learn More
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
