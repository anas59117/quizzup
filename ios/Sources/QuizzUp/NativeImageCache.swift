import Foundation
import ImageIO
import UIKit

@MainActor
final class NativeImageCache {
    static let shared = NativeImageCache()
    private let images = NSCache<NSURL, UIImage>()
    private var downloads: [URL: Task<UIImage?, Never>] = [:]
    private var prefetchQueue: [URL] = []
    private var prefetching = Set<URL>()

    private init() {
        images.totalCostLimit = 48 * 1024 * 1024
        images.countLimit = 32
    }

    func cachedImage(for url: URL) -> UIImage? {
        images.object(forKey: url as NSURL)
    }

    func load(_ url: URL) async -> UIImage? {
        if let image = cachedImage(for: url) { return image }
        if let download = downloads[url] { return await download.value }
        let download = Task<UIImage?, Never> {
            let options: [CFString: Any] = [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 1600,
                kCGImageSourceShouldCacheImmediately: true,
            ]
            guard let (data, response) = try? await URLSession.shared.data(from: url),
                  let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
                  let source = CGImageSourceCreateWithData(data as CFData, nil),
                  let decoded = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
            return UIImage(cgImage: decoded)
        }
        downloads[url] = download
        let image = await download.value
        downloads[url] = nil
        if let image {
            let cost = (image.cgImage?.bytesPerRow ?? 0) * (image.cgImage?.height ?? 0)
            images.setObject(image, forKey: url as NSURL, cost: cost)
        }
        return image
    }

    func prefetch(_ urls: [URL]) {
        for url in urls.prefix(3) {
            Task { _ = await load(url) }
        }
    }

    func prefetchCovers(_ categories: [Category]) {
        let urls = categories.compactMap { category -> URL? in
            guard let entry = NativeCatalog.entry(for: category.key),
                  entry.assetName.flatMap({ UIImage(named: $0) }) == nil, let source = entry.src else { return nil }
            return GameSocket.absoluteImageURL(source)
        }
        for url in urls.prefix(3) {
            guard cachedImage(for: url) == nil, downloads[url] == nil,
                  !prefetching.contains(url), !prefetchQueue.contains(url), prefetchQueue.count < 12 else { continue }
            prefetchQueue.append(url)
        }
        startPrefetches()
    }

    private func startPrefetches() {
        while prefetching.count < 2, !prefetchQueue.isEmpty {
            let url = prefetchQueue.removeFirst()
            prefetching.insert(url)
            Task {
                _ = await load(url)
                prefetching.remove(url)
                startPrefetches()
            }
        }
    }
}
