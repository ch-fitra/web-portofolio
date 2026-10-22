import sharp from "sharp";
export async function prepareUpload(buffer: Buffer, extension: string) {
  if (buffer.length > 10 * 1024 * 1024)
    throw Error("Files must be smaller than 10 MB.");
  const ext = extension.toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    const meta = await sharp(buffer, { limitInputPixels: 40000000 }).metadata();
    const expected: Record<string, string> = {
      ".jpg": "jpeg",
      ".jpeg": "jpeg",
      ".png": "png",
      ".webp": "webp",
    };
    if (meta.format !== expected[ext])
      throw Error("File content does not match its extension.");
    const { data, info } = await sharp(buffer, { limitInputPixels: 40000000 })
      .rotate()
      .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    return {
      buffer: data,
      mime: "image/webp",
      ext: ".webp",
      width: info.width,
      height: info.height,
    };
  }
  if (
    ext === ".pdf" &&
    buffer.subarray(0, 5).toString() === "%PDF-" &&
    buffer.subarray(-1024).includes(Buffer.from("%%EOF"))
  ) {
    // PDFs are always attachments; active/embedded content is not accepted.
    if (
      /\/(JavaScript|JS|OpenAction|AA|EmbeddedFile|Launch|RichMedia|Encrypt)\b/i.test(
        buffer.toString("latin1"),
      )
    )
      throw Error("Active or encrypted PDF content is not supported.");
    return {
      buffer,
      mime: "application/pdf",
      ext: ".pdf",
      width: null,
      height: null,
    };
  }
  throw Error(
    "Use a genuine JPG, PNG, WebP image, or a non-active PDF. SVG and executable files are not accepted.",
  );
}
