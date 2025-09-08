import { Link, useLocation } from "wouter";
import { Upload, Edit, Bot } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  
  const tabs = [
    {
      path: "/file-processor",
      label: "File Processing",
      icon: Upload,
      testId: "tab-file-processor"
    },
    {
      path: "/",
      label: "Prompt Builder", 
      icon: Edit,
      testId: "tab-prompt-builder"
    }
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Prompt Builder Suite</h1>
          </div>
          
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location === tab.path;
              
              return (
                <Link key={tab.path} href={tab.path}>
                  <button
                    className={`px-6 py-2 text-sm font-medium rounded-md border transition-colors ${
                      isActive
                        ? "text-primary bg-accent border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent"
                    }`}
                    data-testid={tab.testId}
                  >
                    <Icon className="h-4 w-4 mr-2 inline" />
                    {tab.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
