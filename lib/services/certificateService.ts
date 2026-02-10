/**
 * Certificate Service
 * Utilities for converting QR code images to base64 and injecting them into SVG certificates.
 */

export interface CertificateTemplate {
    id: string;
    name: string;
    path: string;
}

/**
 * Returns the list of available certificate templates.
 */
export function getCertificateList(): CertificateTemplate[] {
    return [
        { id: "certificate-01", name: "Certificate Style 1", path: "/certificates/certificate-01.svg" },
        { id: "certificate-02", name: "Certificate Style 2", path: "/certificates/certificate-02.svg" },
    ];
}

/**
 * Fetches an image from a URL and converts it to a base64 data URL.
 * Uses a proxy approach: fetches as blob, reads via FileReader.
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to convert image to base64"));
            }
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(blob);
    });
}

/**
 * Injects a base64-encoded QR code image into the SVG text.
 * Finds the <image> element with data-name="qr-code.png" and replaces its xlink:href value.
 */
export function injectQRCodeIntoSVG(svgText: string, qrBase64: string): string {
    // Use a regex to find the <image> tag with data-name="qr-code.png" and replace its xlink:href
    const pattern = /(<image[^>]*data-name="qr-code\.png"[^>]*xlink:href=")[^"]*(")/;
    const match = svgText.match(pattern);

    if (match) {
        return svgText.replace(pattern, `$1${qrBase64}$2`);
    }

    // Fallback: try matching with href instead of xlink:href
    const hrefPattern = /(<image[^>]*data-name="qr-code\.png"[^>]*href=")[^"]*(")/;
    const hrefMatch = svgText.match(hrefPattern);

    if (hrefMatch) {
        return svgText.replace(hrefPattern, `$1${qrBase64}$2`);
    }

    console.warn("Could not find QR code image placeholder in SVG");
    return svgText;
}

/**
 * Fetches an SVG certificate template from the public folder.
 */
export async function fetchCertificateSVG(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to fetch certificate: ${response.statusText}`);
    }
    return response.text();
}

/**
 * Represents a template variable extracted from an SVG certificate.
 */
export interface TemplateVariable {
    key: string;
    label: string;
    defaultValue: string;
    maxCharacters: number;
}

/**
 * Humanize a camelCase variable key into a readable label.
 * e.g. "orgWebsiteUrl" → "Org Website Url"
 */
function humanizeKey(key: string): string {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}

/**
 * Extracts template variables from SVG text.
 * Looks for <tspan> elements whose text content matches {{variableName}}.
 * Reads data-label, data-default-value, and max-characters attributes.
 */
export function extractTemplateVariables(svgText: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const seen = new Set<string>();

    // Match <tspan ...>{{variableName}}</tspan>
    const tspanRegex = /<tspan([^>]*)>\s*\{\{(\w+)\}\}\s*<\/tspan>/g;
    let match;

    while ((match = tspanRegex.exec(svgText)) !== null) {
        const attributes = match[1];
        const key = match[2];

        if (seen.has(key)) continue;
        seen.add(key);

        // Extract data-label
        const labelMatch = attributes.match(/data-label="([^"]*)"/);
        const label = labelMatch ? labelMatch[1] : humanizeKey(key);

        // Extract data-default-value
        const defaultMatch = attributes.match(/data-default-value="([^"]*)"/);
        const defaultValue = defaultMatch ? defaultMatch[1] : "";

        // Extract max-characters
        const maxCharsMatch = attributes.match(/max-characters="(\d+)"/);
        const maxCharacters = maxCharsMatch ? parseInt(maxCharsMatch[1], 10) : 100;

        variables.push({ key, label, defaultValue, maxCharacters });
    }

    return variables;
}

/**
 * Replaces all {{variableKey}} occurrences in the SVG with user-provided values.
 */
export function replaceTemplateVariables(
    svgText: string,
    values: Record<string, string>
): string {
    let result = svgText;
    for (const [key, value] of Object.entries(values)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        result = result.replace(pattern, value);
    }
    return result;
}
