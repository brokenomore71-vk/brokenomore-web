# Avatar Selection Feature Implementation Prompt

## Overview
Implement an avatar selection feature similar to the web signup form, where users can choose from 4 animated GIF avatars. The feature should use static preview images for fast loading, show animated GIFs on hover/selection, and store the selected GIF URL in the database.

## UI/UX Requirements

### Layout
- **Grid Display**: Show 4 circular avatars in a single row (horizontal layout)
- **Avatar Size**: Each avatar should be approximately 96px diameter (or equivalent for mobile)
- **Spacing**: Equal spacing between avatars with appropriate padding
- **Container**: Centered container with max-width to accommodate 4 avatars comfortably

### Visual Design
- **Shape**: Perfect circles (rounded-full)
- **Border**: 
  - Default: Light gray border (2-4px width)
  - Selected: Purple border (`#6B46C1`) with ring effect
  - Hover: Purple border (`#8648d0`) with slight scale animation
- **Background**: Subtle gradient background (purple-100 to pink-100) behind each avatar
- **Selection Indicator**: 
  - Purple checkmark icon in top-right corner when selected
  - Purple ring around selected avatar

### Avatar Images
- **Static Preview (Local)**: Load static PNG/JPG images first from local assets (fast loading)
  - `static_prof1.png`
  - `static_prof2.png`
  - `static_prof3.jpg`
  - `static_prof4.png`
- **Static URLs (ImageKit)**: ImageKit URLs for static images (stored in database)
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof1.png`
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof2.png`
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof3.jpg`
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof4.png`
- **Animated GIF**: Show GIF version on hover/selection (stored in database)
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof.gif?updatedAt=1765300897707`
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof2.gif`
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof3.gif`
  - `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof4.gif`

### Interaction Behavior
1. **Default State**: Show static preview images
2. **On Hover/Touch**: 
   - Preload and display animated GIF
   - Show hover effect (border color change, slight scale)
3. **On Selection**:
   - Show purple border with ring effect
   - Display checkmark icon
   - Keep GIF animation visible
   - Store GIF URL in form state
4. **On Deselect/Hover Out**: Return to static image (unless selected)

## Technical Implementation

### Avatar Configuration
```javascript
const avatars = [
  {
    static: "/assets/images/static_prof1.png", // Local path for fast preview
    staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof1.png", // ImageKit URL for database
    gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof.gif?updatedAt=1765300897707",
  },
  {
    static: "/assets/images/static_prof2.png",
    staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof2.png",
    gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof2.gif",
  },
  {
    static: "/assets/images/static_prof3.jpg",
    staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof3.jpg",
    gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof3.gif",
  },
  {
    static: "/assets/images/static_prof4.png",
    staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof4.png",
    gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof4.gif",
  },
];
```

### State Management
- `selectedAvatarUrl`: Store the selected GIF URL (for database)
- `selectedStaticAvatarUrl`: Store the selected static ImageKit URL (for database)
- `hoveredAvatarIndex`: Track which avatar is being hovered
- `loadedGifs`: Track which GIFs have been preloaded
- `avatarErrors`: Handle image loading errors

### Image Loading Strategy
1. **Initial Load**: Display static images (fast, no network delay)
2. **On Hover**: Preload GIF in background, then switch to GIF
3. **On Selection**: Ensure GIF is loaded and visible
4. **Error Handling**: Show placeholder if image fails to load

### Database Storage
- **Fields**: Two fields in user profile table
  - `avatar_url`: Store the full GIF URL (e.g., `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof.gif?updatedAt=1765300897707`)
  - `static_avatar_url`: Store the full static ImageKit URL (e.g., `https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof1.png`)
- **When**: Save both URLs when user completes profile/signup
- **On Selection**: When user clicks an avatar, store both:
  ```javascript
  setFormData({ 
    avatar_url: avatar.gif,           // GIF URL for animated display
    static_avatar_url: avatar.staticUrl  // Static URL for fast loading
  });
  ```

## Color Scheme
- **Primary Purple**: `#6B46C1`
- **Hover Purple**: `#8648d0`
- **Border Gray**: `#E5E7EB` (default)
- **Background Gradient**: From `purple-100` to `pink-100`

## Mobile Considerations
- **Touch Interaction**: On mobile, show GIF on tap/selection instead of hover
- **Responsive Sizing**: Adjust avatar size based on screen width
- **Performance**: Lazy load GIFs, prioritize static images

## Validation
- **Required**: User must select an avatar before proceeding
- **Error Message**: "Please select an avatar" if none selected

## Example Flow
1. User sees 4 static avatar previews (loaded from local assets for speed)
2. User hovers/taps an avatar → GIF loads and animates
3. User clicks/taps to select → Avatar gets purple border and checkmark
4. Both URLs are stored in form state:
   - `avatar_url`: GIF URL (animated version)
   - `static_avatar_url`: Static ImageKit URL (for fast loading elsewhere)
5. On form submission, both URLs are saved to `user_profiles` table:
   - `user_profiles.avatar_url` → GIF URL
   - `user_profiles.static_avatar_url` → Static ImageKit URL

## Key Features to Implement
✅ Circular avatar display (4 in a row)
✅ Static preview images for fast loading (local assets)
✅ GIF animation on hover/selection
✅ Purple border and checkmark on selection
✅ Error handling for failed image loads
✅ Store both GIF URL and static URL in database
✅ Validation (avatar selection required)
✅ Use local static images for preview, ImageKit URLs for database storage

## Notes
- **Display**: Use local static images (`static_prof1.png`, etc.) for fast preview in the UI
- **Database**: Store ImageKit URLs for both static and GIF versions:
  - `avatar_url`: GIF URL (for animated display in profile/navbar)
  - `static_avatar_url`: Static ImageKit URL (for fast loading in lists/thumbnails)
- **Why Both?**: 
  - GIF for animated profile display (navbar, profile page)
  - Static URL for performance (lists, thumbnails, initial load)
- **ImageKit URLs**: All stored URLs should be ImageKit CDN URLs, not local paths
- Consider caching GIFs after first load for better performance

