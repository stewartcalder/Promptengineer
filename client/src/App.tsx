import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/navigation";
import PromptBuilder from "@/pages/prompt-builder";
import FileProcessor from "@/pages/file-processor";
import NotFound from "@/pages/not-found";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        <Switch>
          <Route path="/" component={PromptBuilder} />
          <Route path="/file-processor" component={FileProcessor} />
          <Route component={NotFound} />
        </Switch>
        
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
