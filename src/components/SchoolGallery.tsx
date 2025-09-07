import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

// Import your actual images
import backgroundImg1 from "../assets/backgroundimg1.jpg";
import backgroundImg2 from "../assets/backgroundimg2.jpg";
import backgroundImg3 from "../assets/backgroundimg3.jpg";
import schoolSiteImg from "../assets/schoolsiteimg.png";
import schoolSiteImg1 from "../assets/schoolsiteimg1.png";
import schoolSiteImg2 from "../assets/schoolsiteimg2.png";
import redBuildings from "../assets/red-buildings-households.jpg";
import waterDwelling from "../assets/water-dwelling.jpg";
// Fallback image from figma assets
import fallbackImage from 'figma:asset/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';

// Gallery images data using your provided images
const galleryImages = [
  {
    src: backgroundImg1,
    alt: "Faith-Life International College Campus Background View 1",
    category: "Campus"
  },
  {
    src: backgroundImg2, 
    alt: "Faith-Life International College Campus Background View 2",
    category: "Campus"
  },
  {
    src: backgroundImg3,
    alt: "Faith-Life International College Campus Background View 3", 
    category: "Campus"
  },
  {
    src: schoolSiteImg,
    alt: "Faith-Life International College Main Building",
    category: "Buildings"
  },
  {
    src: schoolSiteImg1,
    alt: "Faith-Life International College School Facilities 1",
    category: "Buildings" 
  },
  {
    src: schoolSiteImg2,
    alt: "Faith-Life International College School Facilities 2",
    category: "Buildings"
  },
  {
    src: redBuildings,
    alt: "Faith-Life International College Residential Buildings",
    category: "Campus Life"
  },
  {
    src: waterDwelling,
    alt: "Faith-Life International College Water Feature Area",
    category: "Campus Life"
  }
];

interface SchoolGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchoolGallery({ isOpen, onClose }: SchoolGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const categories = ["All", ...Array.from(new Set(galleryImages.map(img => img.category)))];
  
  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    
    const currentIndex = selectedImage;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(newIndex);
  };

  return (
    <>
      {/* Main Gallery Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-primary">Faith-Life International College</h2>
              <p className="text-lg text-muted-foreground">Explore Our Beautiful Campus</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImages.map((image, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => openLightbox(index)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          // Fallback to your provided image
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
                          {image.category}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={onClose}>
                Close Gallery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      {selectedImage !== null && (
        <Dialog open={true} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-black/90">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => navigateImage('prev')}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => navigateImage('next')}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* Main Image */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={filteredImages[selectedImage]?.src}
                  alt={filteredImages[selectedImage]?.alt}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-center">
                <p className="font-medium">{filteredImages[selectedImage]?.alt}</p>
                <p className="text-sm text-gray-300">{filteredImages[selectedImage]?.category}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedImage + 1} of {filteredImages.length}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
