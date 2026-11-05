import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceSearchProps {
  onSearch: (transcript: string) => void;
  className?: string;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onSearch, className = '' }) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startVoiceSearch = () => {
    // Check Speech Recognition support in browser
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(t('speechNotSupported'));
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // Set speech language: 'ta-IN' for Tamil, 'en-IN' for English
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onSearch(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please check browser permissions.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No voice detected. Please try speaking again.');
        } else {
          setErrorMessage(`Voice search issue: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setErrorMessage(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('Could not activate microphone.');
      setIsListening(false);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={startVoiceSearch}
        title={t('voiceSearchPrompt')}
        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-300'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {isListening ? (
          <div className="flex items-center gap-1.5 px-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Listening...</span>
          </div>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {errorMessage && (
        <div className="absolute right-0 top-12 z-50 w-64 p-2 bg-stone-900 text-stone-100 text-xs rounded-lg shadow-xl animate-fade-in border border-stone-700">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
            <MicOff className="w-3.5 h-3.5" />
            <span>Voice Search</span>
          </div>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

