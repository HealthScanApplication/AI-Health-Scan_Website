import { useEffect } from 'react';

export function useDocumentSetup() {
  useEffect(() => {
    // Set up proper meta tags for social sharing and mobile behavior
    const updateViewportMeta = () => {
      let viewportTag = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (!viewportTag) {
        viewportTag = document.createElement('meta');
        viewportTag.setAttribute('name', 'viewport');
        document.head.appendChild(viewportTag);
      }
      // Prevent zoom on input focus while allowing user scaling
      viewportTag.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
    };

    // Add Open Graph meta tags for better Facebook/social sharing
    const updateMetaTags = () => {
      const metaTags = [
        { property: 'og:title', content: 'HealthScan - Know What You Eat Before You Eat It' },
        { property: 'og:description', content: 'Revolutionary food transparency platform exposing toxin levels, nutrient density, and chemical clearance times. Join the movement for food transparency!' },
        { property: 'og:url', content: window.location.origin },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'HealthScan' },
        { property: 'og:image', content: `${window.location.origin}/healthscan-og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'HealthScan - Food Transparency Revolution' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'HealthScan - Know What You Eat Before You Eat It' },
        { name: 'twitter:description', content: 'Revolutionary food transparency platform exposing toxin levels, nutrient density, and chemical clearance times.' },
        { name: 'twitter:image', content: `${window.location.origin}/healthscan-og-image.png` },
        { name: 'description', content: 'Revolutionary food transparency platform exposing toxin levels, nutrient density, and chemical clearance times. Join the movement for food transparency!' }
      ];

      metaTags.forEach(tag => {
        const selector = tag.property ? `meta[property="${tag.property}"]` : `meta[name="${tag.name}"]`;
        let existingTag = document.querySelector(selector) as HTMLMetaElement;
        
        if (existingTag) {
          existingTag.setAttribute('content', tag.content);
        } else {
          const metaElement = document.createElement('meta');
          if (tag.property) metaElement.setAttribute('property', tag.property);
          if (tag.name) metaElement.setAttribute('name', tag.name);
          metaElement.setAttribute('content', tag.content);
          document.head.appendChild(metaElement);
        }
      });

      // Ensure proper title
      document.title = 'HealthScan - Know What You Eat Before You Eat It';
    };

    updateViewportMeta();
    updateMetaTags();
  }, []);
}