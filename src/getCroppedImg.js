// src/utils/getCroppedImg.js
export default function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      if (!crop || !crop.width || !crop.height) {
        return reject(new Error("Zone de recadrage invalide."));
      }

      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(blob => {
        if (!blob || blob.size < 1000) {
          return reject(new Error("L’image générée est vide ou trop petite."));
        }
        blob.name = "cropped.jpg";
        const fileUrl = URL.createObjectURL(blob);
        resolve({ blob, fileUrl });
      }, "image/jpeg");
    };

    image.onerror = () =>
      reject(new Error("Impossible de charger l’image source."));
  });
}
