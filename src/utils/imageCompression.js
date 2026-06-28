/**
 * Comprime una imagen en el cliente antes de subirla al servidor.
 * Redimensiona la imagen manteniendo la relación de aspecto si excede las dimensiones máximas.
 * Convierte a WebP o JPEG con una calidad específica para reducir el peso.
 * 
 * @param {File} file El archivo de imagen original
 * @param {number} maxWidthOrHeight Dimensión máxima (ancho o alto) en píxeles. Por defecto 1080.
 * @param {number} quality Calidad de compresión (0.0 a 1.0). Por defecto 0.8.
 * @returns {Promise<File>} El archivo comprimido
 */
export const compressImage = (file, maxWidthOrHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Si no es una imagen, devolvemos el archivo original
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Calcular nuevas dimensiones manteniendo el aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Rellenar el fondo blanco por si acaso hay transparencias y guardamos en JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);

        // Forzar JPEG debido a políticas de almacenamiento de Supabase
        const mimeType = 'image/jpeg';
        const extension = '.jpg';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fallo al comprimir la imagen en el canvas'));
              return;
            }
            // Crear un nuevo File a partir del Blob comprimido
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, extension), {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};
