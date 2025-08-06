// src/utils/getCroppedImg.js
export default function getCroppedImg(imageSrc, crop) {
  // Taille de sortie désirée (avatar net)
  const OUTPUT_SIZE = 400; // (modifie à 256 si tu préfères)

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      if (!crop || !crop.width || !crop.height) {
        return reject(new Error("Zone de recadrage invalide."));
      }

      // On veut TOUJOURS un carré pour l'avatar, peu importe crop.width/height
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const ctx = canvas.getContext("2d");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // On adapte le crop à la taille de sortie
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      canvas.toBlob(blob => {
        if (!blob || blob.size < 1000) {
          return reject(new Error("L’image générée est vide ou trop petite."));
        }
        blob.name = "cropped.jpg";
        const fileUrl = URL.createObjectURL(blob);
        resolve({ blob, fileUrl });
      }, "image/jpeg", 0.92); // (0.92 = qualité JPEG)
    };

    image.onerror = () =>
      reject(new Error("Impossible de charger l’image source."));
  });
}
