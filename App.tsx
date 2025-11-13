import React, { useState } from 'react';
import { PromptGenerator } from './components/PromptGenerator';
import { ImageEditor } from './components/ImageEditor';
import { ChatBot } from './components/ChatBot';
import { TabButton } from './components/TabButton';
import { UploadIcon, PencilIcon, ChatBubbleIcon, SparklesIcon } from './components/Icons';
import type { UploadedImage } from './types';

type Tab = 'generator' | 'editor' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
  };

  const renderContent = () => {
    if (!uploadedImage) {
      return <ImageUploader onImageUpload={handleImageUpload} />;
    }

    switch (activeTab) {
      case 'generator':
        return <PromptGenerator image={uploadedImage} />;
      case 'editor':
        return <ImageEditor image={uploadedImage} />;
      case 'chat':
        return <ChatBot />;
      default:
        return <PromptGenerator image={uploadedImage} />;
    }
  };

  return (
    <div className="min-h-screen bg-light-gray text-brand-primary font-sans">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-8 h-8 text-brand-primary" />
              <h1 className="text-xl font-bold tracking-tight font-serif">Creative Prompt Engineer</h1>
            </div>
            {uploadedImage && (
              <div className="flex-1 flex items-center justify-center">
                <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                  <TabButton isActive={activeTab === 'generator'} onClick={() => setActiveTab('generator')}>
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Prompt Generator
                  </TabButton>
                  <TabButton isActive={activeTab === 'editor'} onClick={() => setActiveTab('editor')}>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Image Editor
                  </TabButton>
                  <TabButton isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
                    <ChatBubbleIcon className="w-5 h-5 mr-2" />
                    AI Chat
                  </TabButton>
                </nav>
              </div>
            )}
             {uploadedImage && (
                 <button onClick={() => setUploadedImage(null)} className="text-sm border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center">
                    <UploadIcon className="w-4 h-4 mr-2"/>
                    Upload New
                </button>
             )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload({
          file,
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center px-4">
      <h1 className="text-5xl md:text-6xl font-serif font-bold text-brand-primary mb-4">Creative Prompt Engineer</h1>
      <p className="text-lg text-gray-600 max-w-xl mb-8">Bring your creative vision to life. Upload an image to generate a detailed text-to-image prompt and start creating.</p>
      <label className="relative cursor-pointer">
          <div className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2">
              <UploadIcon className="w-5 h-5" />
              <span>Upload Image</span>
          </div>
          <input 
            type="file" 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files)}
          />
      </label>
      <p className="text-sm text-gray-500 mt-4">Upload an image to kickstart your creative process.</p>
    </div>
  );
};


export default App;