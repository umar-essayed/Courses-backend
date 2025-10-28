/**
 * Sinceides Platform - Advanced Video Processing & Streaming
 * This file contains video processing, compression, and streaming functionality
 */

const { v2: cloudinary } = require('cloudinary');
const sharp = require('sharp');

// Video Processing Configuration
export class VideoProcessingConfig {
  // Supported video qualities
  static readonly VIDEO_QUALITIES = ['360', '480', '720', '1080'];
  
  // Compression settings
  static readonly COMPRESSION_QUALITY = parseInt(process.env.VIDEO_COMPRESSION_QUALITY || '80');
  static readonly THUMBNAIL_GENERATION = process.env.THUMBNAIL_GENERATION === 'true';
  
  // Video formats
  static readonly SUPPORTED_FORMATS = ['mp4', 'webm', 'avi', 'mov'];
  static readonly PREFERRED_FORMAT = 'mp4';
  
  // Thumbnail settings
  static readonly THUMBNAIL_WIDTH = 640;
  static readonly THUMBNAIL_HEIGHT = 360;
  static readonly THUMBNAIL_QUALITY = 90;
  
  // Streaming settings
  static readonly ADAPTIVE_BITRATE = true;
  static readonly HLS_SEGMENT_DURATION = 10; // seconds
  static readonly HLS_PLAYLIST_SIZE = 5;
}

// Video Processing Service
export class VideoProcessingService {
  constructor() {
    // Initialize Cloudinary with video processing settings
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Upload video with multiple quality variants
  async uploadVideoWithQualities(
    buffer: Buffer, 
    folder: string = 'videos',
    options: {
      generateThumbnail?: boolean;
      qualities?: string[];
      compressionQuality?: number;
    } = {}
  ): Promise<{
    originalUrl: string;
    qualityUrls: { [quality: string]: string };
    thumbnailUrl?: string;
    duration?: number;
    size?: number;
  }> {
    const {
      generateThumbnail = VideoProcessingConfig.THUMBNAIL_GENERATION,
      qualities = VideoProcessingConfig.VIDEO_QUALITIES,
      compressionQuality = VideoProcessingConfig.COMPRESSION_QUALITY
    } = options;

    try {
      // Upload original video
      const originalResult = await this.uploadVideo(buffer, folder, {
        quality: compressionQuality,
        format: VideoProcessingConfig.PREFERRED_FORMAT
      });

      const qualityUrls: { [quality: string]: string } = {};
      
      // Generate quality variants
      for (const quality of qualities) {
        const qualityUrl = this.generateQualityUrl(originalResult.url, quality);
        qualityUrls[quality] = qualityUrl;
      }

      // Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (generateThumbnail) {
        thumbnailUrl = await this.generateVideoThumbnail(originalResult.url);
      }

      return {
        originalUrl: originalResult.url,
        qualityUrls,
        thumbnailUrl,
        duration: originalResult.duration,
        size: originalResult.bytes
      };

    } catch (error) {
      console.error('Error uploading video with qualities:', error);
      throw new Error('Failed to upload video with quality variants');
    }
  }

  // Upload single video
  async uploadVideo(
    buffer: Buffer, 
    folder: string = 'videos',
    options: {
      quality?: number;
      format?: string;
      width?: number;
      height?: number;
    } = {}
  ): Promise<{
    url: string;
    publicId: string;
    duration?: number;
    bytes?: number;
  }> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: 'video',
        quality: options.quality || VideoProcessingConfig.COMPRESSION_QUALITY,
        format: options.format || VideoProcessingConfig.PREFERRED_FORMAT,
        ...(options.width && { width: options.width }),
        ...(options.height && { height: options.height })
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              publicId: result!.public_id,
              duration: result!.duration,
              bytes: result!.bytes
            });
          }
        }
      ).end(buffer);
    });
  }

  // Generate quality-specific URL
  generateQualityUrl(originalUrl: string, quality: string): string {
    const width = this.getQualityWidth(quality);
    return cloudinary.url(originalUrl, {
      resource_type: 'video',
      quality: 'auto',
      width: width,
      format: VideoProcessingConfig.PREFERRED_FORMAT,
      fetch_format: 'auto'
    });
  }

  // Get width for quality
  private getQualityWidth(quality: string): number {
    const qualityMap: { [key: string]: number } = {
      '360': 640,
      '480': 854,
      '720': 1280,
      '1080': 1920
    };
    return qualityMap[quality] || 1280;
  }

  // Generate video thumbnail
  async generateVideoThumbnail(videoUrl: string): Promise<string> {
    return cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'jpg',
      width: VideoProcessingConfig.THUMBNAIL_WIDTH,
      height: VideoProcessingConfig.THUMBNAIL_HEIGHT,
      crop: 'fill',
      gravity: 'center',
      quality: VideoProcessingConfig.THUMBNAIL_QUALITY
    });
  }

  // Generate multiple thumbnails for video preview
  async generateVideoThumbnails(
    videoUrl: string, 
    count: number = 5
  ): Promise<string[]> {
    const thumbnails: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const thumbnailUrl = cloudinary.url(videoUrl, {
        resource_type: 'video',
        format: 'jpg',
        width: VideoProcessingConfig.THUMBNAIL_WIDTH,
        height: VideoProcessingConfig.THUMBNAIL_HEIGHT,
        crop: 'fill',
        gravity: 'center',
        quality: VideoProcessingConfig.THUMBNAIL_QUALITY,
        offset: `${i * 20}%` // Generate thumbnails at different time points
      });
      thumbnails.push(thumbnailUrl);
    }
    
    return thumbnails;
  }

  // Compress video
  async compressVideo(
    buffer: Buffer,
    options: {
      quality?: number;
      width?: number;
      height?: number;
      format?: string;
    } = {}
  ): Promise<Buffer> {
    // For now, we'll use Cloudinary's compression
    // In a production environment, you might want to use FFmpeg
    const compressedResult = await this.uploadVideo(buffer, 'temp', {
      quality: options.quality || VideoProcessingConfig.COMPRESSION_QUALITY,
      width: options.width,
      height: options.height,
      format: options.format || VideoProcessingConfig.PREFERRED_FORMAT
    });

    // Download the compressed video
    const response = await fetch(compressedResult.url);
    return Buffer.from(await response.arrayBuffer());
  }

  // Generate HLS streaming URLs
  generateHLSStreamingUrls(videoUrl: string): {
    masterPlaylist: string;
    qualityPlaylists: { [quality: string]: string };
  } {
    const masterPlaylist = cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'm3u8',
      streaming_profile: 'hd'
    });

    const qualityPlaylists: { [quality: string]: string } = {};
    
    VideoProcessingConfig.VIDEO_QUALITIES.forEach(quality => {
      const width = this.getQualityWidth(quality);
      qualityPlaylists[quality] = cloudinary.url(videoUrl, {
        resource_type: 'video',
        format: 'm3u8',
        width: width,
        quality: 'auto',
        streaming_profile: 'hd'
      });
    });

    return {
      masterPlaylist,
      qualityPlaylists
    };
  }

  // Generate DASH streaming URLs
  generateDASHStreamingUrls(videoUrl: string): {
    manifest: string;
    qualityManifests: { [quality: string]: string };
  } {
    const manifest = cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'mpd',
      streaming_profile: 'hd'
    });

    const qualityManifests: { [quality: string]: string } = {};
    
    VideoProcessingConfig.VIDEO_QUALITIES.forEach(quality => {
      const width = this.getQualityWidth(quality);
      qualityManifests[quality] = cloudinary.url(videoUrl, {
        resource_type: 'video',
        format: 'mpd',
        width: width,
        quality: 'auto',
        streaming_profile: 'hd'
      });
    });

    return {
      manifest,
      qualityManifests
    };
  }

  // Get video information
  async getVideoInfo(videoUrl: string): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
    size: number;
    bitrate: number;
  }> {
    try {
      const publicId = this.extractPublicId(videoUrl);
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video'
      });

      return {
        duration: result.duration,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        bitrate: result.bit_rate
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw new Error('Failed to get video information');
    }
  }

  // Extract public ID from Cloudinary URL
  private extractPublicId(url: string): string {
    const match = url.match(/\/v\d+\/(.+)\./);
    return match ? match[1] : '';
  }

  // Delete video and all its variants
  async deleteVideo(videoUrl: string): Promise<boolean> {
    try {
      const publicId = this.extractPublicId(videoUrl);
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        invalidate: true
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  // Generate video preview GIF
  async generateVideoPreviewGif(
    videoUrl: string,
    options: {
      width?: number;
      height?: number;
      duration?: number;
      startTime?: number;
    } = {}
  ): Promise<string> {
    const {
      width = VideoProcessingConfig.THUMBNAIL_WIDTH,
      height = VideoProcessingConfig.THUMBNAIL_HEIGHT,
      duration = 5,
      startTime = 0
    } = options;

    return cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'gif',
      width: width,
      height: height,
      crop: 'fill',
      gravity: 'center',
      start_offset: startTime,
      duration: duration,
      quality: 'auto'
    });
  }

  // Generate video waveform
  async generateVideoWaveform(videoUrl: string): Promise<string> {
    return cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'png',
      width: 800,
      height: 200,
      crop: 'fill',
      gravity: 'center',
      effect: 'waveform'
    });
  }

  // Generate video sprite (multiple frames in one image)
  async generateVideoSprite(
    videoUrl: string,
    options: {
      width?: number;
      height?: number;
      columns?: number;
      rows?: number;
    } = {}
  ): Promise<string> {
    const {
      width = 160,
      height = 90,
      columns = 5,
      rows = 4
    } = options;

    return cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'jpg',
      width: width * columns,
      height: height * rows,
      crop: 'fill',
      gravity: 'center',
      effect: `spritesheet:${columns}x${rows}`
    });
  }

  // Optimize video for web
  async optimizeVideoForWeb(buffer: Buffer): Promise<Buffer> {
    // Compress video for web delivery
    const compressedBuffer = await this.compressVideo(buffer, {
      quality: VideoProcessingConfig.COMPRESSION_QUALITY,
      format: VideoProcessingConfig.PREFERRED_FORMAT
    });

    return compressedBuffer;
  }

  // Generate video subtitles/captions
  async generateVideoCaptions(videoUrl: string): Promise<string> {
    // This would typically use a speech-to-text service
    // For now, we'll return a placeholder
    return cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'vtt',
      streaming_profile: 'hd'
    });
  }

  // Generate video chapters
  async generateVideoChapters(videoUrl: string): Promise<{
    chapters: Array<{
      startTime: number;
      endTime: number;
      title: string;
      description?: string;
    }>;
  }> {
    // This would typically use AI to analyze video content
    // For now, we'll return a placeholder structure
    return {
      chapters: [
        {
          startTime: 0,
          endTime: 30,
          title: 'Introduction',
          description: 'Course introduction and overview'
        },
        {
          startTime: 30,
          endTime: 60,
          title: 'Main Content',
          description: 'Core lesson content'
        },
        {
          startTime: 60,
          endTime: 90,
          title: 'Conclusion',
          description: 'Summary and next steps'
        }
      ]
    };
  }
}

// Video Streaming Service
export class VideoStreamingService {
  constructor(private videoProcessingService: VideoProcessingService) {}

  // Get streaming URLs for a video
  async getStreamingUrls(videoUrl: string, format: 'hls' | 'dash' = 'hls'): Promise<{
    streamingUrls: any;
    thumbnailUrl: string;
    previewGif?: string;
    waveform?: string;
  }> {
    const thumbnailUrl = await this.videoProcessingService.generateVideoThumbnail(videoUrl);
    
    let streamingUrls;
    if (format === 'hls') {
      streamingUrls = this.videoProcessingService.generateHLSStreamingUrls(videoUrl);
    } else {
      streamingUrls = this.videoProcessingService.generateDASHStreamingUrls(videoUrl);
    }

    const previewGif = await this.videoProcessingService.generateVideoPreviewGif(videoUrl);
    const waveform = await this.videoProcessingService.generateVideoWaveform(videoUrl);

    return {
      streamingUrls,
      thumbnailUrl,
      previewGif,
      waveform
    };
  }

  // Get adaptive streaming configuration
  getAdaptiveStreamingConfig(): {
    qualities: string[];
    defaultQuality: string;
    autoQuality: boolean;
    bufferSize: number;
  } {
    return {
      qualities: VideoProcessingConfig.VIDEO_QUALITIES,
      defaultQuality: '720',
      autoQuality: VideoProcessingConfig.ADAPTIVE_BITRATE,
      bufferSize: VideoProcessingConfig.HLS_SEGMENT_DURATION
    };
  }

  // Generate video player configuration
  generatePlayerConfig(videoUrl: string): {
    sources: Array<{
      src: string;
      type: string;
      label: string;
    }>;
    poster: string;
    tracks: Array<{
      kind: string;
      src: string;
      srclang: string;
      label: string;
    }>;
  } {
    const hlsUrls = this.videoProcessingService.generateHLSStreamingUrls(videoUrl);
    
    const sources = VideoProcessingConfig.VIDEO_QUALITIES.map(quality => ({
      src: hlsUrls.qualityPlaylists[quality],
      type: 'application/x-mpegURL',
      label: `${quality}p`
    }));

    return {
      sources,
      poster: '', // Will be set by the calling function
      tracks: [
        {
          kind: 'captions',
          src: '',
          srclang: 'en',
          label: 'English'
        }
      ]
    };
  }
}

// Initialize services
const videoProcessingService = new VideoProcessingService();
const videoStreamingService = new VideoStreamingService(videoProcessingService);

module.exports = {
  VideoProcessingConfig,
  VideoProcessingService,
  VideoStreamingService,
  videoProcessingService,
  videoStreamingService
};
