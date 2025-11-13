import React, { useState } from 'react';
import { editImageWithPrompt } from '../services/geminiService';
import type { UploadedImage } from '../types';
import { SparklesIcon, DownloadIcon } from './Icons';
import { Spinner } from './Spinner';

interface ImageEditorProps {
  image: UploadedImage;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ image }) => {
    const [prompt, setPrompt] = useState('');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEditImage = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setEditedImage(null);
        try {
            const result = await editImageWithPrompt({
                base64: image.base64,
                mimeType: image.file.type,
            }, prompt);
            setEditedImage(result);
        } catch (err) {
            setError('Failed to edit image. The model might not support this edit.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col space-y-4">
                <h2 className="text-2xl font-bold font-serif">Original Image</h2>
                <div className="aspect-square w-full bg-white rounded-lg overflow-hidden border border-gray-200 p-2">
                    <img src={image.base64} alt="Original for editing" className="w-full h-full object-contain rounded-md" />
                </div>
            </div>
            <div className="flex flex-col space-y-4">
                <h2 className="text-2xl font-bold font-serif">Edit Image with AI</h2>
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                    <label htmlFor="editPrompt" className="block font-medium text-gray-700">
                        Describe your edit
                    </label>
                    <input
                        id="editPrompt"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Add a retro filter' or 'Make it a watercolor painting'"
                        className="w-full bg-light-gray border border-gray-300 rounded-md p-3 focus:ring-brand-secondary focus:border-brand-secondary transition"
                    />
                    <button 
                      onClick={handleEditImage} 
                      disabled={isLoading || !prompt}
                      className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary hover:bg-gray-800 text-white font-bold rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" /> Apply Edit</>}
                    </button>
                </div>

                {error && <div className="text-red-700 bg-red-100 border border-red-200 p-4 rounded-lg">{error}</div>}

                <h2 className="text-2xl font-bold font-serif pt-4">Result</h2>
                <div className="aspect-square w-full bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
                    {isLoading && (
                        <div className="text-center">
                            <Spinner />
                            <p className="mt-2 text-gray-600">Editing in progress...</p>
                        </div>
                    )}
                    {editedImage && !isLoading && (
                         <div className="relative w-full h-full">
                            <img src={editedImage} alt="Edited result" className="w-full h-full object-contain rounded-md" />
                            <a href={editedImage} download="edited-image.png" className="absolute bottom-3 right-3 flex items-center py-2 px-3 bg-brand-secondary hover:bg-indigo-700 text-white font-semibold rounded-lg transition text-sm shadow-lg">
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Download
                            </a>
                        </div>
                    )}
                    {!editedImage && !isLoading && (
                        <p className="text-gray-500">Your edited image will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};