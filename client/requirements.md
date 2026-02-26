## Packages
date-fns | Essential for manipulating and formatting dates for the schedule grid
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes safely

## Notes
- The application uses a session-based auth model relying on cookies (credentials: "include").
- The dashboard requires a dense data grid layout. Horizontal scrolling is implemented for mobile/smaller screens to view full months.
- Assumes the backend API is structured exactly as defined in the provided schema and routes manifest.
