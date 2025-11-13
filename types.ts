
export interface PromptParts {
  scene: string;
  background: string;
  imageType: string;
  style: string;
  texture: string;
  lighting: string;
  details: string;
  fullPrompt: string;
}

export interface UploadedImage {
  file: File;
  base64: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
