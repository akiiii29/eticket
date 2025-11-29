export const generateBrandedQR = async (
    qrUrl: string,
    size = 512
): Promise<string> => {
    const QRCode = (await import("qrcode")).default;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    await QRCode.toCanvas(canvas, qrUrl, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
    } as any);

    try {
        const ctx = canvas.getContext("2d");
        if (!ctx) return canvas.toDataURL("image/png");

        const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            // In Next.js, assets in /public are served from root path
            img.src = "/logo.png";
        });

        const logoScale = 0.22; // 22% of QR size
        const logoSize = Math.floor(size * logoScale);
        const x = Math.floor((size - logoSize) / 2);
        const y = Math.floor((size - logoSize) / 2);

        // Draw a white rounded background under the logo to keep QR scannable
        const radius = Math.floor(logoSize * 0.2);
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + logoSize - radius, y);
        ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + radius);
        ctx.lineTo(x + logoSize, y + logoSize - radius);
        ctx.quadraticCurveTo(
            x + logoSize,
            y + logoSize,
            x + logoSize - radius,
            y + logoSize
        );
        ctx.lineTo(x + radius, y + logoSize);
        ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw the logo image centered, preserve aspect ratio and add padding inside the rounded box
        const padding = Math.floor(logoSize * 0.12);
        const maxInner = logoSize - padding * 2;
        const aspect = logo.width / logo.height || 1;
        let drawW = maxInner;
        let drawH = Math.floor(maxInner / aspect);
        if (drawH > maxInner) {
            drawH = maxInner;
            drawW = Math.floor(maxInner * aspect);
        }
        const drawX = x + Math.floor((logoSize - drawW) / 2);
        const drawY = y + Math.floor((logoSize - drawH) / 2);
        ctx.drawImage(logo, drawX, drawY, drawW, drawH);

        return canvas.toDataURL("image/png");
    } catch {
        // If logo fails to load, return plain QR
        return canvas.toDataURL("image/png");
    }
};
