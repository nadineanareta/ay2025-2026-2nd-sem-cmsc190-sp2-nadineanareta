import { useEffect, useRef } from 'react'; 
 
// This component displays an image with a bounding box annotation, given the image URL and box coordinates.
 const ImageWithAnnotationComponent = ({ imageUrl, boxCoordinates }) => {
    const imgRef = useRef(null);
    const boxRef = useRef(null);

    useEffect(() => {
      if (imgRef.current && boxRef.current && boxCoordinates) {
        const img = imgRef.current;
        const box = boxRef.current;
        
        const imgWidth = img.clientWidth;
        const imgHeight = img.clientHeight;
        
        const [x1, y1, x2, y2] = boxCoordinates;
        const left = x1 * imgWidth;
        const top = y1 * imgHeight;
        const width = (x2 - x1) * imgWidth;
        const height = (y2 - y1) * imgHeight;
        
        boxRef.current.style.left = `${left}px`;
        boxRef.current.style.top = `${top}px`;
        boxRef.current.style.width = `${width}px`;
        boxRef.current.style.height = `${height}px`;
      }
    }, [boxCoordinates]);

    return (
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <img 
          ref={imgRef} 
          src={imageUrl}  
          className="block w-full"
          onLoad={() => {
            // Reposition when image loads
            if (boxRef.current && boxCoordinates) {
              const img = imgRef.current;
              const [x1, y1, x2, y2] = boxCoordinates;
              boxRef.current.style.left = `${x1 * img.clientWidth}px`;
              boxRef.current.style.top = `${y1 * img.clientHeight}px`;
              boxRef.current.style.width = `${(x2 - x1) * img.clientWidth}px`;
              boxRef.current.style.height = `${(y2 - y1) * img.clientHeight}px`;
            }
          }}
        />
        {boxCoordinates && (
          <span
            ref={boxRef}
            className="absolute border-2 border-red-500 pointer-events-none"
          />
        )}
      </span>
    );
  };

export default ImageWithAnnotationComponent;