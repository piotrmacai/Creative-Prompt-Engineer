import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeImageAndGeneratePrompt, generateImageFromPrompt, breakdownPromptIntoParts } from '../services/geminiService';
import type { UploadedImage, PromptParts } from '../types';
import { SparklesIcon, CopyIcon, DownloadIcon, PhotoIcon } from './Icons';
import { Spinner } from './Spinner';

interface PromptGeneratorProps {
  image: UploadedImage;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ image }) => {
  const [promptParts, setPromptParts] = useState<PromptParts | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const userIsEditingFullPrompt = useRef(false);
  const initialAnalysisDone = useRef(false);
  const [debouncedFullPrompt, setDebouncedFullPrompt] = useState('');

  const runAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    initialAnalysisDone.current = false;
    setError(null);
    try {
      const result = await analyzeImageAndGeneratePrompt({
        base64: image.base64,
        mimeType: image.file.type,
      });
      setPromptParts(result);
    } catch (err) {
      setError('Failed to analyze the image. Please try again.');
      console.error(err);
    } finally {
      setIsLoadingAnalysis(false);
      initialAnalysisDone.current = true;
    }
  }, [image]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const reAnalyzePrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsReanalyzing(true);
    setError(null);
    try {
        const result = await breakdownPromptIntoParts(prompt);
        setPromptParts(result);
    } catch (err) {
        setError('Failed to re-analyze the prompt. Please try again.');
        console.error(err);
    } finally {
        setIsReanalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (promptParts?.fullPrompt) {
        const handler = setTimeout(() => {
            setDebouncedFullPrompt(promptParts.fullPrompt);
        }, 500); // 0.5s debounce for faster feedback
        return () => clearTimeout(handler);
    }
  }, [promptParts?.fullPrompt]);

  useEffect(() => {
    if (debouncedFullPrompt && userIsEditingFullPrompt.current && initialAnalysisDone.current) {
        userIsEditingFullPrompt.current = false; // consume the flag
        reAnalyzePrompt(debouncedFullPrompt);
    }
  }, [debouncedFullPrompt, reAnalyzePrompt]);

  const handlePromptPartChange = (field: keyof PromptParts, value: string) => {
    setPromptParts(prev => {
      if (!prev) return null;
      
      if (field === 'fullPrompt') {
        // User is editing the fullPrompt itself. A debounced effect will trigger re-analysis.
        userIsEditingFullPrompt.current = true;
        return { ...prev, fullPrompt: value };
      }

      // User is editing a component part.
      const newParts = { ...prev, [field]: value };
      const oldValue = prev[field];
      
      let newFullPrompt = prev.fullPrompt;

      // If the old value was a non-empty string, try to replace it in the full prompt.
      // This preserves the overall structure and order.
      if (oldValue && oldValue.trim() !== '') {
        newFullPrompt = newFullPrompt.replace(oldValue, value);
      } 
      // If the old value was empty and the new one is not, we are adding a new concept.
      // We append it to avoid losing the new information.
      else if (value && value.trim() !== '') {
        // If the full prompt is empty, just set it to the new value.
        if (newFullPrompt.trim() === '') {
            newFullPrompt = value;
        } else {
            // Otherwise, append with a comma.
            newFullPrompt = `${newFullPrompt}, ${value}`;
        }
      }

      // A more robust way to clean up commas and extra spaces.
      newFullPrompt = newFullPrompt
        .split(',')
        .map(p => p.trim())
        .filter(p => p) // Filter out any empty strings that result from cleanup
        .join(', ');


      return { ...newParts, fullPrompt: newFullPrompt };
    });
  };

  const handleGenerateImage = async () => {
      if (!promptParts?.fullPrompt) return;
      setIsLoadingGeneration(true);
      setError(null);
      setGeneratedImage(null);
      try {
          const newImage = await generateImageFromPrompt(promptParts.fullPrompt);
          setGeneratedImage(newImage);
      } catch (err) {
          setError('Failed to generate image. Please try a different prompt.');
          console.error(err);
      } finally {
          setIsLoadingGeneration(false);
      }
  };

  const handleCopy = () => {
    if (promptParts?.fullPrompt) {
        navigator.clipboard.writeText(promptParts.fullPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold font-serif">Original Image</h2>
        <div className="aspect-square w-full bg-white rounded-lg overflow-hidden border border-gray-200 p-2">
            <img src={image.base64} alt="Uploaded" className="w-full h-full object-contain rounded-md" />
        </div>
      </div>
      
      <div className="flex flex-col space-y-6">
        <h2 className="text-2xl font-bold font-serif">Prompt Breakdown</h2>
        {isLoadingAnalysis && (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8 border border-gray-200">
                <Spinner />
                <p className="mt-4 text-gray-600">AI is analyzing your image...</p>
            </div>
        )}
        {error && !isLoadingAnalysis && <div className="text-red-700 bg-red-100 border border-red-200 p-4 rounded-lg">{error}</div>}
        {promptParts && !isLoadingAnalysis && (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <label htmlFor="fullPrompt" className="block text-sm font-medium text-gray-500 mb-1">Full Prompt</label>
                    <div className="relative">
                        <textarea
                            id="fullPrompt"
                            rows={4}
                            className="w-full bg-light-gray border border-gray-300 rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            value={promptParts.fullPrompt}
                            onChange={(e) => handlePromptPartChange('fullPrompt', e.target.value)}
                        />
                        <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">
                            <CopyIcon className="w-5 h-5" />
                            {copied && <span className="absolute -top-8 right-0 text-xs bg-green-600 text-white px-2 py-1 rounded">Copied!</span>}
                        </button>
                    </div>
                </div>
                
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isReanalyzing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                            <Spinner />
                            <span className="ml-2 text-gray-700">Syncing...</span>
                        </div>
                    )}
                    {Object.entries(promptParts).filter(([key]) => key !== 'fullPrompt').map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                            <label htmlFor={key} className="block text-sm font-medium text-gray-500 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input
                                type="text"
                                id={key}
                                className="w-full bg-light-gray border border-gray-300 rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                                value={value}
                                onChange={(e) => handlePromptPartChange(key as keyof PromptParts, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <button 
                  onClick={handleGenerateImage} 
                  disabled={isLoadingGeneration}
                  className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary hover:bg-gray-800 text-white font-bold rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoadingGeneration ? <Spinner /> : <><PhotoIcon className="w-5 h-5 mr-2" /> Generate New Image</>}
                </button>

                {generatedImage && (
                     <div className="flex flex-col space-y-4 mt-4">
                        <h3 className="text-xl font-bold font-serif">Generated Image</h3>
                        <div className="relative aspect-square w-full bg-white rounded-lg overflow-hidden border border-gray-200 p-2">
                            <img src={generatedImage} alt="Generated from prompt" className="w-full h-full object-contain rounded-md" />
                            <a href={generatedImage} download="generated-image.jpg" className="absolute bottom-3 right-3 flex items-center py-2 px-3 bg-brand-secondary hover:bg-indigo-700 text-white font-semibold rounded-lg transition text-sm shadow-lg">
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Download
                            </a>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};