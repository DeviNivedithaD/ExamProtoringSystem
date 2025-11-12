# Design Guidelines: Exam Proctoring System

## Design Approach
**Selected System**: Material Design 3  
**Justification**: This is a utility-focused, information-dense application requiring clarity, trust, and efficient data visualization. Material Design provides robust patterns for dashboards, real-time monitoring, and complex data displays while maintaining professional credibility.

**Key Principles**:
- Clarity over decoration: Every element serves a functional purpose
- Trust through professionalism: Clean, structured layouts that inspire confidence
- Immediate information access: Critical data visible without scrolling
- Clear status indicators: Real-time monitoring requires instant visual feedback

## Typography System
- **Primary Font**: Inter (via Google Fonts)
- **Headings**: 
  - H1: text-3xl font-bold (Dashboard titles)
  - H2: text-2xl font-semibold (Section headers)
  - H3: text-xl font-semibold (Card titles)
- **Body**: text-base font-normal (default content)
- **Labels**: text-sm font-medium (form labels, metadata)
- **Captions**: text-xs font-normal (timestamps, helper text)

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 for consistency (e.g., p-4, m-6, gap-8)

**Layout Structure**:
- Dashboard container: max-w-7xl mx-auto px-6
- Card padding: p-6
- Section gaps: space-y-8
- Grid gaps: gap-6

## Component Library

### Navigation
**Admin Dashboard Navigation**:
- Fixed top navigation bar with application title
- Tab navigation for switching between "Active Sessions", "Violation Logs", "Students"
- Logout button in top-right corner

**Student View Navigation**:
- Minimal top bar showing exam title and timer
- Warning counter displayed prominently
- Emergency exit button (triggers logout after confirmation)

### Core UI Elements

**Status Cards**:
- Bordered cards with shadow-sm
- Header with icon and title
- Real-time status badges (Active/Inactive, Connected/Disconnected)
- Metric displays with large numbers and labels

**Violation Alert Cards**:
- Warning-level color coding (yellow for warnings, red for critical)
- Icon, timestamp, violation type, and student info
- Action buttons for review/dismiss

**Monitoring Panels**:
- Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each student gets a card showing:
  - Name and exam session
  - Warning count with visual indicator
  - Webcam feed placeholder (border with aspect-video ratio)
  - Connection status badge

**Data Tables**:
- Clean table with alternating row backgrounds
- Sticky header
- Sortable columns with arrow indicators
- Action column for quick access

### Student Exam Interface

**Exam Container**:
- Full-width centered layout (max-w-4xl)
- Fixed header with exam title, timer, and warning counter
- Main content area with generous padding (p-8)
- Exam questions/content area
- Submit button at bottom

**Warning Display**:
- Fixed position alert banner that slides in from top
- Displays warning message and count
- Auto-dismisses after 5 seconds
- Visual progression: yellow (1-2 warnings) → red (3 warnings = logout)

**Camera/Mic Indicators**:
- Small badge icons in top-right showing recording status
- Green dot = active, red dot = connection issue
- Hoverable tooltip showing full status

### Admin Dashboard Components

**Overview Section**:
- Stats grid: Total active sessions, total students, total violations today
- Large number displays with trend indicators
- Quick action buttons (Start New Session, View Reports)

**Active Sessions List**:
- Card-based layout with session details
- Each card shows: Exam name, start time, student count, violation count
- "Monitor" button to view detailed session
- Filter and search controls

**Violation Log Table**:
- Chronological list with filters (by type, by student, by severity)
- Columns: Timestamp, Student, Violation Type, Action Taken, Details
- Export button for generating reports

### Forms & Inputs

**Session Start Form**:
- Clean vertical form layout
- Input fields: Exam name, duration, student selection
- Checkbox for enabling features (webcam required, strict mode)
- Primary action button at bottom

**All Form Fields**:
- Consistent height (h-10 for inputs)
- Border with focus ring
- Label above input (required asterisk for mandatory fields)
- Helper text below in muted color

### Overlays

**Confirmation Modals**:
- Centered overlay with backdrop blur
- Max-width container (max-w-md)
- Header with title and close button
- Content area with clear messaging
- Action buttons (Cancel as secondary, Confirm as primary)

**Warning Popup (Student View)**:
- Toast-style notification
- Slides from top
- Icon + message + warning number
- Auto-dismiss with progress bar

## Icons
**Library**: Material Icons (via CDN)  
**Usage**:
- Navigation: dashboard, assignment, people, logout
- Statuses: check_circle, warning, error, videocam, mic
- Actions: refresh, download, visibility, delete

## Visual Hierarchy

**Information Priority**:
1. Critical warnings and real-time violations (most prominent)
2. Active session status and timer
3. Navigation and controls
4. Historical data and logs

**Component Elevation**:
- Floating alerts/warnings: shadow-lg
- Cards and containers: shadow-sm
- Flat surfaces: no shadow

## Responsive Behavior
- Desktop (lg): Multi-column grids, expanded sidebar navigation
- Tablet (md): 2-column layouts, collapsible sidebar
- Mobile: Single column, bottom navigation for student view, simplified admin interface

## Accessibility
- Clear focus indicators on all interactive elements
- ARIA labels for status indicators and real-time updates
- Keyboard navigation for all critical functions
- High contrast between text and backgrounds
- Screen reader announcements for violation alerts

## No Hero Image
This is a utility application. Both student and admin views should launch directly into functional interfaces without marketing-style hero sections.