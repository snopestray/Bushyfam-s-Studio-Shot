
export const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};


export const dataUrlToBlob = (dataUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => resolve(blob))
      .catch(err => reject(err));
  });
};
