import Foundation
import Vision
import ImageIO

// Local-only OCR. No network calls or external service dependencies.
let bytes = FileHandle.standardInput.readDataToEndOfFile()
guard let source = CGImageSourceCreateWithData(bytes as CFData, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fputs("Cannot decode reference image\n", stderr)
    exit(1)
}
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: image).perform([request])
let rows: [[String: Any]] = (request.results ?? []).compactMap { observation in
    guard let text = observation.topCandidates(1).first else { return nil }
    let box = observation.boundingBox
    return ["text": text.string, "confidence": text.confidence,
            "x": box.minX * 100, "y": (1 - box.maxY) * 100,
            "width": box.width * 100, "height": box.height * 100]
}
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: rows))
