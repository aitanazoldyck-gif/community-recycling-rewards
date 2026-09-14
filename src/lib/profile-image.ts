export async function prepareProfileImage(file: File): Promise<string> {
  const source = await readFile(file);
  const image = await loadImage(source);
  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to process image file.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL("image/jpeg", 0.82);
  if (result.length > 3_500_000) {
    throw new Error("Please choose a smaller image.");
  }
  return result;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to process image file."));
    image.src = source;
  });
}
