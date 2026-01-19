// app/chromaKey.ts

export const removeGreenScreen = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageSrc);

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Get pixel data
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const length = data.length;

      // Loop through every pixel
      for (let i = 0; i < length; i += 4) {
        const r = data[i + 0];
        const g = data[i + 1];
        const b = data[i + 2];

        // 🟢 MATH: Is this pixel GREEN?
        // If Green is > 90 and significantly higher than Red/Blue, it's the background.
        if (g > 90 && g > r * 1.2 && g > b * 1.2) {
          data[i + 3] = 0; // Set Alpha to 0 (Transparent)
        }
      }

      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => resolve(imageSrc);
  });
};