/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Your own uploads
      { protocol: "https", hostname: "res.cloudinary.com" },
      
      // Wikimedia / Wikipedia
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "*.wikimedia.org" },
      
      // Flickr
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "*.staticflickr.com" },
      
      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "unsplash.com" },
      
      // Imgur
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "*.imgur.com" },
      
      // Reddit
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      
      // Pinterest
      { protocol: "https", hostname: "i.pinimg.com" },
      
      // Pexels / Pixabay
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "cdn.pexels.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      
      // WordPress / Blogger
      { protocol: "https", hostname: "*.wp.com" },
      { protocol: "https", hostname: "*.files.wordpress.com" },
      { protocol: "https", hostname: "*.bp.blogspot.com" },
      { protocol: "https", hostname: "*.blogger.com" },
      
      // Google / Dropbox / generic CDNs
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.gstatic.com" },
      { protocol: "https", hostname: "dl.dropboxusercontent.com" },
      { protocol: "https", hostname: "*.dropbox.com" },
      
      // AWS S3
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      
      // Internet Archive
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "*.archive.org" },
      
      // GitHub
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "*.githubusercontent.com" },
      
      // Geograph (UK photography archive)
      { protocol: "https", hostname: "geograph.org.uk" },
      { protocol: "https", hostname: "*.geograph.org.uk" },
      
      // Squarespace
      { protocol: "https", hostname: "images.squarespace-cdn.com" },
      { protocol: "https", hostname: "*.squarespace-cdn.com" },
      
      // News / Media
      { protocol: "https", hostname: "eluniversal.com.mx" },
      { protocol: "https", hostname: "*.eluniversal.com.mx" },
      { protocol: "https", hostname: "i.huffpost.com" },
      { protocol: "https", hostname: "*.huffpost.com" },
      { protocol: "https", hostname: "media.wnyc.org" },
      
      // Government / Institutional
      { protocol: "https", hostname: "doc.govt.nz" },
      { protocol: "https", hostname: "*.doc.govt.nz" },
      
      // Tourism / Regional
      { protocol: "https", hostname: "amazonasemais.com.br" },
      { protocol: "https", hostname: "*.amazonasemais.com.br" },
      { protocol: "https", hostname: "brasiltotalreceptivos.com.br" },
      { protocol: "https", hostname: "*.brasiltotalreceptivos.com.br" },
      
      // Urban Exploration Blogs
      { protocol: "https", hostname: "abandonedsoutheast.com" },
      { protocol: "https", hostname: "*.abandonedsoutheast.com" },
      
      // Placeholders (remove later)
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,OPTIONS" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;