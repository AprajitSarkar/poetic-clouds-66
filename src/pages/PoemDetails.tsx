
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Poem } from "@/services/poetryService";
import PoemCard from "@/components/PoemCard";
import { ArrowLeft, Share2, Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { speechService } from "@/services/speechService";
import { useUserSettings } from "@/contexts/UserSettingsContext";

const PoemDetails = () => {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [isReading, setIsReading] = useState(false);
  const { settings } = useUserSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const storedPoem = sessionStorage.getItem("selectedPoem");
    if (storedPoem) {
      setPoem(JSON.parse(storedPoem));
    } else {
      navigate("/poems");
    }
  }, [navigate]);

  // Set up speech synthesis event listeners
  useEffect(() => {
    const handleSpeechEnd = () => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking) {
        setIsReading(false);
      }
    };

    // Check for speech status periodically
    let interval: number | null = null;
    if (isReading) {
      interval = window.setInterval(handleSpeechEnd, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isReading]);

  const goBack = () => {
    // Stop any ongoing reading when navigating away
    if (isReading) {
      speechService.stop();
    }
    navigate(-1);
  };

  const sharePoem = () => {
    if (poem) {
      // Create a formatted poem text with title, author, and poem text
      const poemText = `${poem.title}\nby ${poem.author}\n\n${poem.lines.join("\n")}\n\nShared from Poetic Clouds app\nGet it on Play Store: https://play.google.com/store/apps/details?id=com.hitmouse`;
      
      if (navigator.share) {
        navigator
          .share({
            title: `${poem.title} by ${poem.author}`,
            text: poemText,
          })
          .catch((error) => console.log("Error sharing", error));
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(poemText);
        toast.success("Poem copied to clipboard!");
      }
    }
  };

  const readPoem = () => {
    if (!poem) return;
    
    // Format the poem text for a better reading experience
    const title = `${poem.title} by ${poem.author}.`;
    
    // Add pauses between stanzas for better rhythm
    const poemLines = poem.lines.join(". ");
    const poemText = `${title} ${poemLines}`;
    
    // Get the user's preferred voice if available
    let voice = null;
    if (settings.preferredVoice) {
      voice = window.speechSynthesis.getVoices().find(
        v => v.voiceURI === settings.preferredVoice?.id
      ) || null;
    }
    
    setIsReading(true);
    speechService.speak(poemText, voice);
    
    toast.success("Reading poem aloud", {
      description: "Using " + (settings.preferredVoice?.name || "default voice")
    });
  };

  const stopReading = () => {
    speechService.stop();
    setIsReading(false);
    toast.success("Stopped reading");
  };

  if (!poem) {
    return (
      <div className="container px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-foreground/70">Loading poem...</div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen">
      <div className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-10 p-4">
        <div className="flex justify-between items-center max-w-screen-lg mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-foreground/80 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          
          <h1 className="text-lg font-serif font-medium text-primary truncate max-w-[150px] sm:max-w-[200px]">
            {poem.title}
          </h1>
          
          <button
            onClick={sharePoem}
            className="flex items-center gap-1 text-foreground/80 hover:text-primary transition-colors"
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="pt-20 pb-24 px-4">
        <div className="mb-8 space-y-4">
          <div className="flex justify-end">
            {isReading ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={stopReading} 
                className="flex items-center gap-1"
              >
                <MicOff size={16} />
                <span>Stop</span>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={readPoem} 
                className="flex items-center gap-1"
              >
                <Volume2 size={16} />
                <span>Read Aloud</span>
              </Button>
            )}
          </div>
        </div>

        {poem && <PoemCard poem={poem} fullView={true} />}
        
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground/60">
            {poem.linecount} lines • Published by {poem.author}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoemDetails;
